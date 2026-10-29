import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChoiceField } from './AdvancedControls';
import { softmax, classifierCounts } from '@/lib/multiclass';
const p = softmax([1,2,.5]).probabilities;
export const typeScenarios = [
['Customer churn: churn or no churn.','Binary','Two mutually exclusive outcomes; not a set of labels.'],
['A fruit belongs to exactly one of four categories.','Multiclass','Four exclusive classes require one class ID.'],
['A photograph contains a person, dog and bicycle.','Multi-label','Objects coexist; predicting just one would discard valid labels.'],
['A transaction is fraudulent or legitimate.','Binary','Two exclusive classes even when one is rare.'],
['A handwritten digit is one value from 0 to 9.','Multiclass','Ten possible values, exactly one per image.'],
['A film can be drama, romance and comedy simultaneously.','Multi-label','Genres are not mutually exclusive.'],
];
export const practiceScenarios = [
{ q:'Each fruit belongs to exactly one of four categories. What is the target?', options:['Binary','Multiclass','Multi-label'], answer:1, why:'Multiclass assigns exactly one of four categories. Binary has only two outcomes; multi-label allows simultaneous categories.' },
{ q:'An image contains a person, a dog and a bicycle. What structure preserves all objects?',options:['One softmax class','One binary object flag','A multi-label binary vector'],answer:2,why:'A multi-label vector can select all three objects. A softmax class picks one; a single flag cannot describe different objects.' },
{ q:'With eight classes, how many one-vs-one estimators are needed?',options:['8','28','64'],answer:1,why:`8×7/2 = ${classifierCounts(8).ovo}. Eight is the OvR count; 64 includes duplicate and self pairs.` },
{ q:'Scores are A=1, B=2, C=0.5. Which softmax result is correct?',options:['A 33%, B 33%, C 33%',`A ${(100*(p[0]??0)).toFixed(1)}%, B ${(100*(p[1]??0)).toFixed(1)}%, C ${(100*(p[2]??0)).toFixed(1)}%`,'A 100%, B 200%, C 50%'],answer:1,why:'Exponentiate then normalize. B has the largest score and probability. Equal probabilities would require equal scores; raw scores are not percentages.' },
{ q:'Overall accuracy is high but a rare class is almost never recognized. What should you inspect?',options:['Only overall accuracy','Support-weighted F1 alone','Macro F1 and rare-class recall'],answer:2,why:'Macro gives each class equal weight; rare-class recall directly exposes misses. Overall accuracy and weighted F1 may be dominated by frequent classes.' },
{ q:'A news article is both technology and business. Which output is appropriate?',options:['One class ID','[1,1,0,0] for an ordered label set','Softmax probabilities forced to sum to one'],answer:1,why:'A binary indicator vector records both labels. One ID discards a topic; forcing competition with softmax is inappropriate for independent coexisting labels without a specific modeling reason.' },
{ q:'True labels [1,1,1,1], predicted [1,1,1,0]. What are subset accuracy and Hamming loss?',options:['75% and 25%','0% and 25%','100% and 0%'],answer:1,why:'The whole set fails exact match, so subset accuracy is 0. One of four label decisions is wrong, giving 25% Hamming loss. 75% is label-decision accuracy, not subset accuracy.' },
{ q:'Person, bicycle and helmet labels are correlated. Which baseline comparison is informative?',options:['Binary relevance versus classifier chains','Assume a bicycle always implies a helmet','Force one object per image'],answer:0,why:'Chains may use earlier labels as features while binary relevance does not explicitly model dependencies. Correlation is not a deterministic rule; objects can coexist.' },
];
export function ProblemSelector() {
 const [index,setIndex]=useState('0');const [answer,setAnswer]=useState('');const [submitted,setSubmitted]=useState(false);const s=typeScenarios[Number(index)]??typeScenarios[0];if(!s)return null;
 return <div className="my-6 space-y-4 border-y py-5"><ChoiceField label="Problem scenario" value={index} options={Object.fromEntries(typeScenarios.map((x,i)=>[String(i),x[0]??'']))} onChange={v=>{setIndex(v);setAnswer('');setSubmitted(false);}}/><fieldset><legend className="mb-2 text-sm font-medium">Choose the problem type</legend>{['Binary','Multiclass','Multi-label'].map(n=><label key={n} className="mr-4 inline-flex items-center gap-2 py-2 text-sm"><input type="radio" name="problem-type" checked={answer===n} onChange={()=>{setAnswer(n);setSubmitted(false);}} className="accent-primary"/>{n}</label>)}</fieldset><Button disabled={!answer} onClick={()=>setSubmitted(true)}>Submit answer</Button>{submitted && <div role="status" className="space-y-3 text-sm"><p><strong>{answer===s[1]?'Correct.':'Reconsider the target.'}</strong> {s[2]}</p><Button variant="outline" onClick={()=>{setAnswer('');setSubmitted(false);}}>Retry</Button></div>}</div>;
}
export function MulticlassPractice() {
 const [index,setIndex]=useState('0');const [answer,setAnswer]=useState<number|null>(null);const [submitted,setSubmitted]=useState(false);const s=practiceScenarios[Number(index)];if(!s)return null;
 return <div className="my-6 space-y-5 border-y py-5"><ChoiceField label="Practice scenario" value={index} options={Object.fromEntries(practiceScenarios.map((s,i)=>[String(i),`${i+1}. ${s.q}`]))} onChange={v=>{setIndex(v);setAnswer(null);setSubmitted(false);}}/><p className="font-medium">{s.q}</p><fieldset className="space-y-3"><legend className="sr-only">Answer choices</legend>{s.options.map((o,i)=><label key={o} className="flex items-start gap-3 text-sm"><input type="radio" name="practice-answer" className="mt-1 accent-primary" checked={answer===i} onChange={()=>{setAnswer(i);setSubmitted(false);}}/>{o}</label>)}</fieldset><Button disabled={answer===null} onClick={()=>setSubmitted(true)}>Submit answer</Button>{submitted && <div role="status" className="space-y-3 text-sm"><p><strong>{answer===s.answer?'Best-supported answer.':'Try the alternative reasoning.'}</strong> {s.why}</p><Button variant="outline" onClick={()=>{setAnswer(null);setSubmitted(false);}}>Retry</Button></div>}</div>;
}
