"""Rebuild the small local classifier. Inference needs Node.js only."""
import json
from pathlib import Path
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix

root=Path(__file__).resolve().parent
data=json.loads((root/'training.json').read_text())
X=[]; y=[]
for label,examples in data['examples'].items():
    X.extend(examples); y.extend([label]*len(examples))
pipe=Pipeline([('tfidf',TfidfVectorizer(lowercase=True,token_pattern=r'(?u)\b\w\w+\b',ngram_range=(1,1),sublinear_tf=False)),('clf',LogisticRegression(C=8,max_iter=1200,random_state=42))])
pipe.fit(X,y)
v=pipe.named_steps['tfidf']; c=pipe.named_steps['clf']
out={'version':'scopeproof-local-tfidf-logreg-v1','classes':c.classes_.tolist(),'vocabulary':v.vocabulary_,'idf':v.idf_.tolist(),'coefficients':c.coef_.tolist(),'intercepts':c.intercept_.tolist(),'training_count':len(X),'language':'English','provenance':data['provenance']}
(root/'model.json').write_text(json.dumps(out,separators=(',',':'),default=lambda x:int(x)))
truth=[x[0] for x in data['held_out']]; pred=pipe.predict([x[1] for x in data['held_out']])
report={'held_out_examples':len(truth),'accuracy':float(accuracy_score(truth,pred)),'labels':c.classes_.tolist(),'confusion_matrix':confusion_matrix(truth,pred,labels=c.classes_).tolist(),'limitations':'Small synthetic, same-domain English evaluation. Not a real-customer or independent benchmark. No general language understanding or calibrated certainty claim.','predictions':[{'text':r[1],'expected':r[0],'predicted':str(p)} for r,p in zip(data['held_out'],pred)]}
(root/'evaluation.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'training':len(X),'held_out':len(truth),'synthetic_accuracy':report['accuracy']}))
