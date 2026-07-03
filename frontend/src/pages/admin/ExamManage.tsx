import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import type { Exam, Question, Category } from '@/types';

const levels = [
  { value: 'L1', label: '入门' },
  { value: 'L2', label: '进阶' },
  { value: 'L3', label: '高级' },
];

const levelBadge = (l: string) => {
  const m: Record<string, string> = { L1: 'bg-green-100 text-green-700', L2: 'bg-yellow-100 text-yellow-700', L3: 'bg-red-100 text-red-700' };
  return m[l] || 'bg-gray-100 text-gray-600';
};

/** Find a subset of questions whose scores sum exactly to `target`. Brute-force for small gaps. */
function findSubset(candidates: Question[], target: number, scoreMap: Record<number, number>): number[] {
  if (target <= 0) return [];
  // Sort by score ascending for better matching
  const sorted = [...candidates].sort((a, b) => (scoreMap[a.id] || 2) - (scoreMap[b.id] || 2));

  function dfs(start: number, remaining: number, path: number[]): number[] | null {
    if (remaining === 0) return path;
    if (remaining < 0 || start >= sorted.length) return null;
    for (let i = start; i < sorted.length; i++) {
      const qid = sorted[i].id;
      const qs = scoreMap[qid] || 2;
      if (qs > remaining) break; // sorted ascending, rest are larger
      const result = dfs(i + 1, remaining - qs, [...path, qid]);
      if (result) return result;
    }
    return null;
  }
  return dfs(0, target, []) || [];
}

export default function ExamManage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', time_limit_minutes: 30, pass_score: 60, question_ids: [] as number[] });
  const [filter, setFilter] = useState({ category_id: '', level: '' });
  const [mode, setMode] = useState<'manual' | 'dist' | 'smart'>('manual');
  const [randomCount, setRandomCount] = useState(10);
  const [smartTargetScore, setSmartTargetScore] = useState(100);

  const fetchExams = () => { api.get('/exams').then((r) => setExams(r.data)); };

  useEffect(() => {
    api.get('/courses/categories').then((r) => setCategories(r.data));
    fetchExams();
  }, []);

  const fetchQuestions = () => {
    const p = new URLSearchParams();
    if (filter.category_id) p.set('category_id', filter.category_id);
    if (filter.level) p.set('level', filter.level);
    api.get(`/questions?${p}`).then((r) => setQuestions(r.data));
  };

  const fetchAllQuestions = () => {
    api.get('/questions?limit=500').then((r) => setAllQuestions(r.data));
  };

  useEffect(() => {
    if (showForm) {
      fetchQuestions();
      fetchAllQuestions();
    }
  }, [filter.category_id, filter.level, showForm]);

  // Compute question counts and score info per category × level from allQuestions
  const distData = useMemo(() => {
    const map: Record<string, Record<string, { count: number; ids: number[]; totalScore: number }>> = {};
    for (const cat of categories) {
      map[cat.id] = {};
      for (const lv of levels) {
        const qs = allQuestions.filter((q) => q.category_id === cat.id && q.level === lv.value);
        map[cat.id][lv.value] = { count: qs.length, ids: qs.map((q) => q.id), totalScore: qs.reduce((s, q) => s + q.score, 0) };
      }
    }
    return map;
  }, [allQuestions, categories]);

  const [distInputs, setDistInputs] = useState<Record<string, number>>({});

  const handleDistApply = () => {
    const ids: number[] = [];
    for (const catId of Object.keys(distData)) {
      for (const lv of levels) {
        const n = distInputs[`${catId}-${lv.value}`] || 0;
        const available = distData[catId]?.[lv.value]?.ids || [];
        const picked = [...available].sort(() => Math.random() - 0.5).slice(0, Math.min(n, available.length));
        ids.push(...picked);
      }
    }
    setForm((prev) => ({ ...prev, question_ids: [...new Set([...prev.question_ids, ...ids])] }));
  };

  const handleSmartGenerate = () => {
    const scoreMap: Record<number, number> = {};
    for (const q of allQuestions) scoreMap[q.id] = q.score;

    // Collect all category×level buckets
    const buckets: { catId: string; lv: string; ids: number[]; totalScore: number }[] = [];
    let grandTotalScore = 0;
    for (const catId of Object.keys(distData)) {
      for (const lv of levels) {
        const d = distData[catId]?.[lv.value];
        if (d && d.count > 0) {
          buckets.push({ catId, lv: lv.value, ids: d.ids, totalScore: d.totalScore });
          grandTotalScore += d.totalScore;
        }
      }
    }
    if (grandTotalScore === 0) return;

    const targetScore = Math.min(smartTargetScore, grandTotalScore);
    const pickedSet = new Set<number>();
    let total = 0;

    // Phase 1: proportional pick across buckets, never exceeding bucket budget
    for (let bi = 0; bi < buckets.length; bi++) {
      const bucket = buckets[bi];
      const isLast = bi === buckets.length - 1;
      const bucketBudget = isLast
        ? targetScore - total
        : Math.floor(targetScore * (bucket.totalScore / grandTotalScore));
      if (bucketBudget <= 0) continue;

      const shuffled = [...bucket.ids].sort(() => Math.random() - 0.5);
      let acc = 0;
      for (const qid of shuffled) {
        const qs = scoreMap[qid] || 2;
        if (acc + qs > bucketBudget) continue; // never exceed bucket budget
        pickedSet.add(qid);
        acc += qs;
        total += qs;
      }
    }

    // Phase 2: try to fill the remaining gap exactly
    const gap = targetScore - total;
    if (gap > 0) {
      // Find a single question that fills the gap exactly
      const exactMatch = allQuestions.find(
        (q) => !pickedSet.has(q.id) && q.score === gap
      );
      if (exactMatch) {
        pickedSet.add(exactMatch.id);
        total += exactMatch.score;
      } else {
        // Try swap: find an unpicked question whose score > gap, and a picked
        // question whose score = (unpicked score - gap), then swap them
        let swapped = false;
        for (const q of allQuestions) {
          if (swapped || pickedSet.has(q.id) || q.score <= gap) continue;
          const neededRemove = q.score - gap;
          for (const pid of pickedSet) {
            if (scoreMap[pid] === neededRemove) {
              pickedSet.delete(pid);
              pickedSet.add(q.id);
              total = total - neededRemove + q.score;
              swapped = true;
              break;
            }
          }
        }
        // If still not exact, try adding 2+ questions
        if (!swapped) {
          const remaining = allQuestions.filter((q) => !pickedSet.has(q.id));
          // Simple brute force for small gaps: try picking questions to sum to gap
          const fillIds = findSubset(remaining, gap, scoreMap);
          for (const fid of fillIds) {
            pickedSet.add(fid);
            total += scoreMap[fid] || 2;
          }
        }
      }
    }

    // Phase 3: if still over target, trim
    if (total > targetScore) {
      const idsArr = [...pickedSet];
      while (total > targetScore && idsArr.length > 0) {
        const lastId = idsArr.pop()!;
        total -= scoreMap[lastId] || 2;
        pickedSet.delete(lastId);
      }
    }

    setForm((prev) => ({ ...prev, question_ids: [...pickedSet] }));
  };

  const handleCreate = async () => {
    if (form.question_ids.length === 0) { alert('请至少选择一道题目'); return; }
    if (!form.title.trim()) { alert('请输入考试名称'); return; }
    try {
      await api.post('/exams', form);
      setShowForm(false);
      setForm({ title: '', description: '', time_limit_minutes: 30, pass_score: 60, question_ids: [] });
      setDistInputs({});
      fetchExams();
    } catch (err: any) {
      alert(err.response?.data?.detail || '创建失败，请检查网络连接后重试');
    }
  };

  const toggleQuestion = (qid: number) => {
    setForm((prev) => ({
      ...prev,
      question_ids: prev.question_ids.includes(qid) ? prev.question_ids.filter((id) => id !== qid) : [...prev.question_ids, qid],
    }));
  };

  const selectAllVisible = () => {
    const visibleIds = questions.map((q) => q.id);
    setForm((prev) => ({ ...prev, question_ids: [...new Set([...prev.question_ids, ...visibleIds])] }));
  };

  const clearAllVisible = () => {
    const visibleIds = new Set(questions.map((q) => q.id));
    setForm((prev) => ({ ...prev, question_ids: prev.question_ids.filter((id) => !visibleIds.has(id)) }));
  };

  const handleRandomPick = () => {
    const available = questions.filter((q) => !form.question_ids.includes(q.id));
    const picked = [...available].sort(() => Math.random() - 0.5).slice(0, Math.min(randomCount, available.length));
    setForm((prev) => ({ ...prev, question_ids: [...prev.question_ids, ...picked.map((q) => q.id)] }));
  };

  const selectedScore = allQuestions.filter((q) => form.question_ids.includes(q.id)).reduce((sum, q) => sum + q.score, 0);

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">⚙️ 考试管理</h2>
        <button onClick={() => { setShowForm(true); fetchQuestions(); fetchAllQuestions(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">创建考试</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-lg">创建考试</h3>
          <div className="grid grid-cols-4 gap-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="考试名称" className="px-3 py-2 border border-gray-300 rounded-lg text-sm col-span-2" />
            <input type="number" value={form.time_limit_minutes} onChange={(e) => setForm({ ...form, time_limit_minutes: Number(e.target.value) })}
              placeholder="时长(分钟)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input type="number" value={form.pass_score} onChange={(e) => setForm({ ...form, pass_score: Number(e.target.value) })}
              placeholder="及格分数" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="考试描述（可选）" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />

          {/* Mode tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {([
              { v: 'manual', l: '📋 手动选题' },
              { v: 'dist', l: '📊 按分布选题' },
              { v: 'smart', l: '🤖 智能组卷' },
            ] as const).map(({ v, l }) => (
              <button key={v} onClick={() => setMode(v)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${mode === v ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Manual mode */}
          {mode === 'manual' && (
            <>
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-sm text-gray-500">筛选：</span>
                <select value={filter.category_id} onChange={(e) => setFilter({ ...filter, category_id: e.target.value })}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm">
                  <option value="">全部领域</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={filter.level} onChange={(e) => setFilter({ ...filter, level: e.target.value })}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm">
                  <option value="">全部等级</option>
                  {levels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <span className="text-xs text-gray-400">({questions.length} 题)</span>
                <button onClick={selectAllVisible} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100">全选</button>
                <button onClick={clearAllVisible} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100">清空</button>
                <div className="flex items-center gap-1 ml-2">
                  <input type="number" value={randomCount} onChange={(e) => setRandomCount(Number(e.target.value))}
                    className="w-12 px-1.5 py-1 border border-gray-200 rounded text-xs text-center" min={1} />
                  <button onClick={handleRandomPick} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">随机抽取</button>
                </div>
                <span className="ml-auto text-sm text-gray-500">
                  已选 <span className="font-bold text-blue-600">{form.question_ids.length}</span> 题 · 总分 <span className="font-bold text-blue-600">{selectedScore}</span>
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                {questions.map((q) => (
                  <label key={q.id} className={`flex items-start gap-2 p-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 ${form.question_ids.includes(q.id) ? 'bg-blue-50' : ''}`}>
                    <input type="checkbox" checked={form.question_ids.includes(q.id)} onChange={() => toggleQuestion(q.id)} className="mt-0.5 text-blue-600 rounded shrink-0" />
                    <div className="flex-1 text-sm min-w-0">
                      <span className="block truncate">{q.title}</span>
                      <span className="text-xs text-gray-400">
                        {q.type === 'single' ? '单选' : q.type === 'multi' ? '多选' : '判断'} · {q.score}分
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${levelBadge(q.level)}`}>{levels.find((l) => l.value === q.level)?.label || q.level}</span>
                      </span>
                    </div>
                  </label>
                ))}
                {questions.length === 0 && <p className="text-sm text-gray-400 text-center py-8">暂无题目</p>}
              </div>
            </>
          )}

          {/* Distribution mode */}
          {mode === 'dist' && (
            <>
              <p className="text-xs text-gray-400">输入每个领域+等级需要抽取的题目数量，点击"应用"随机抽取</p>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">领域</th>
                      {levels.map((l) => (
                        <th key={l.value} className="px-3 py-2 text-center text-gray-500 font-medium w-28">{l.label} ({l.value})</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categories.map((cat) => (
                      <tr key={cat.id}>
                        <td className="px-3 py-2 text-gray-700 text-xs">{cat.name}</td>
                        {levels.map((lv) => {
                          const d = distData[cat.id]?.[lv.value];
                          const key = `${cat.id}-${lv.value}`;
                          return (
                            <td key={lv.value} className="px-3 py-2 text-center">
                              {d && d.count > 0 ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input type="number" min={0} max={d.count} value={distInputs[key] || 0}
                                    onChange={(e) => setDistInputs((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                                    className="w-14 px-1.5 py-1 border border-gray-200 rounded text-xs text-center" />
                                  <span className="text-xs text-gray-400">/{d.count}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-300">0</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={handleDistApply} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">应用选题</button>
                <button onClick={() => setDistInputs({})} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">清空分布</button>
                <span className="ml-auto text-sm text-gray-500">
                  已选 <span className="font-bold text-blue-600">{form.question_ids.length}</span> 题 · 总分 <span className="font-bold text-blue-600">{selectedScore}</span>
                </span>
              </div>
            </>
          )}

          {/* Smart mode */}
          {mode === 'smart' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">设定目标总分，系统按题库分布比例自动抽取题目凑到目标分数</p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">目标总分：</span>
                <input type="number" value={smartTargetScore} onChange={(e) => setSmartTargetScore(Number(e.target.value))}
                  className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm" min={1} step={5} />
                <span className="text-sm text-gray-500">分</span>
                <button onClick={handleSmartGenerate} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">智能生成</button>
                <span className="text-xs text-gray-400">（题库共 {allQuestions.reduce((s, q) => s + q.score, 0)} 分可用）</span>
              </div>
              {form.question_ids.length > 0 && (
                <div className="text-sm text-gray-500">
                  已生成 <span className="font-bold text-blue-600">{form.question_ids.length}</span> 题 · 实际总分 <span className={`font-bold ${selectedScore === smartTargetScore ? 'text-green-600' : Math.abs(selectedScore - smartTargetScore) <= 5 ? 'text-yellow-600' : 'text-blue-600'}`}>{selectedScore}</span> 分
                  {selectedScore !== smartTargetScore && <span className="text-xs text-gray-400 ml-1">（目标 {smartTargetScore} 分，误差 ±{(Math.abs(selectedScore - smartTargetScore))} 分）</span>}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button onClick={handleCreate} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">确定</button>
            <button onClick={() => { setShowForm(false); setDistInputs({}); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">取消</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">考试名称</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-16">题数</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-20">时长</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-16">总分</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-16">及格</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-24">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exams.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800">{e.title}</td>
                <td className="px-4 py-3 text-gray-500">{e.question_count}</td>
                <td className="px-4 py-3 text-gray-500">{e.time_limit_minutes}分钟</td>
                <td className="px-4 py-3 text-gray-500">{e.total_score}</td>
                <td className="px-4 py-3 text-gray-500">{e.pass_score}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${e.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {e.status === 'published' ? '已发布' : e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
