/**
 * Shared Gemini helper.
 * Uses the real Gemini API when GEMINI_API_KEY is available,
 * otherwise falls back to a sophisticated local response generator
 * so the app remains fully functional in all environments.
 */

const GEMINI_MODEL = 'gemini-2.0-flash';
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';

export function hasGeminiKey() {
  return Boolean(API_KEY);
}

/**
 * Call Gemini with a prompt and return the text response.
 */
export async function callGemini(prompt, systemInstruction) {
  if (!API_KEY) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('Gemini API error:', res.status, txt.slice(0, 300));
      return null;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch (err) {
    console.error('Gemini call failed:', err.message);
    return null;
  }
}

/**
 * Call Gemini with conversation history (contents array) and system instruction.
 */
export async function callGeminiChat(messages, systemInstruction) {
  if (!API_KEY) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
    
    // Map application roles to Gemini API roles: 'user' -> 'user', 'assistant' -> 'model'
    const contents = [];
    for (const msg of messages) {
      if (!msg.content) continue;
      const role = msg.role === 'user' ? 'user' : 'model';
      contents.push({
        role,
        parts: [{ text: msg.content }]
      });
    }

    const body = {
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    };
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('Gemini API error:', res.status, txt.slice(0, 300));
      return null;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch (err) {
    console.error('Gemini chat call failed:', err.message);
    return null;
  }
}

/**
 * Call Gemini expecting a JSON object response. Strips code fences.
 */
export async function callGeminiJSON(prompt, systemInstruction) {
  const text = await callGemini(prompt, systemInstruction);
  if (!text) return null;
  try {
    let cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last !== -1) cleaned = cleaned.slice(first, last + 1);
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini JSON parse failed:', err.message);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  LOCAL FALLBACK GENERATORS                                         */
/* ------------------------------------------------------------------ */

const QUESTION_BANK = {
  behavioral: [
    'Tell me about yourself and what drew you to this role.',
    'Describe a challenging project you worked on. What was your role and the outcome?',
    'Tell me about a time you faced a conflict in a team. How did you resolve it?',
    'Describe a situation where you had to learn a new skill quickly. How did you approach it?',
    'Tell me about a time you failed. What did you learn from it?',
    'Describe your proudest professional achievement and why it matters to you.',
    'How do you prioritize tasks when everything seems urgent?',
    'Tell me about a time you received critical feedback. How did you respond?',
  ],
  technical: [
    'Walk me through your approach to designing a scalable system from scratch.',
    'How would you optimize a slow-running application or query?',
    'Explain a complex technical concept to someone non-technical.',
    'Describe how you ensure code quality and maintainability in your projects.',
    'What metrics would you track to measure the success of a feature you shipped?',
    'How do you stay current with emerging technologies in your field?',
    'Describe your debugging process when production goes down.',
    'How would you design for high availability and fault tolerance?',
  ],
  situational: [
    'If you joined our team tomorrow, what would your first 30 days look like?',
    'How would you handle a stakeholder who keeps changing requirements mid-sprint?',
    'Imagine you disagree with your manager on a technical decision. What do you do?',
    'What would you do if you noticed a critical bug the day before a major release?',
  ],
};

const SKILL_LIBRARY = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker',
  'Kubernetes', 'GraphQL', 'REST APIs', 'CI/CD', 'Git', 'System Design', 'Microservices',
  'PostgreSQL', 'MongoDB', 'Redis', 'TensorFlow', 'PyTorch', 'Machine Learning',
  'Data Analysis', 'Tableau', 'Leadership', 'Agile', 'Scrum', 'Communication',
  'Project Management', 'Stakeholder Management', 'Product Strategy', 'A/B Testing',
  'SEO', 'Content Strategy', 'Figma', 'UI/UX Design', 'User Research', 'Copywriting',
  'Excel', 'Power BI', 'Statistics', 'Forecasting', 'Negotiation', 'Public Speaking',
];

const ROADMAP_TEMPLATES = {
  'software engineer': [
    { phase: 'Foundation', duration: 'Weeks 1-4', items: ['Master data structures & algorithms fundamentals', 'Build 2 portfolio projects with clean Git history', 'Set up a professional GitHub profile and README'] },
    { phase: 'Core Skills', duration: 'Weeks 5-10', items: ['Deepen knowledge of system design & scalability', 'Learn a backend framework deeply (Node/Python/Go)', 'Practice 50+ LeetCode problems by pattern'] },
    { phase: 'Specialization', duration: 'Weeks 11-16', items: ['Deploy a full-stack app with CI/CD pipeline', 'Contribute to an open-source project', 'Write technical blog posts to solidify learning'] },
    { phase: 'Interview Prep', duration: 'Weeks 17-20', items: ['Do 15+ mock interviews with peers', 'Craft a strong STAR-format resume', 'Apply to 30+ targeted roles with tailored cover letters'] },
  ],
  'data scientist': [
    { phase: 'Foundation', duration: 'Weeks 1-4', items: ['Strengthen statistics & linear algebra fundamentals', 'Master Python data stack: pandas, NumPy, matplotlib', 'Complete 1 end-to-end EDA project on Kaggle'] },
    { phase: 'Core Skills', duration: 'Weeks 5-10', items: ['Learn supervised & unsupervised ML algorithms', 'Build a predictive model and document the full pipeline', 'Practice SQL window functions and complex queries'] },
    { phase: 'Specialization', duration: 'Weeks 11-16', items: ['Deploy an ML model with a REST API endpoint', 'Study deep learning with PyTorch or TensorFlow', 'Build a portfolio of 3 diverse ML projects'] },
    { phase: 'Interview Prep', duration: 'Weeks 17-20', items: ['Practice ML system design and case interviews', 'Prepare a data storytelling presentation', 'Apply to 30+ data roles with project-heavy resume'] },
  ],
  'product manager': [
    { phase: 'Foundation', duration: 'Weeks 1-4', items: ['Study product frameworks (JTBD, RICE, Kano)', 'Analyze 5 products you admire and write teardowns', 'Learn SQL basics to query product data independently'] },
    { phase: 'Core Skills', duration: 'Weeks 5-10', items: ['Build a PRD for a feature end-to-end', 'Learn wireframing in Figma and usability testing', 'Practice estimating impact and prioritization tradeoffs'] },
    { phase: 'Specialization', duration: 'Weeks 11-16', items: ['Run a mock product sprint with metrics & A/B test plan', 'Study product analytics (funnels, retention, cohort analysis)', 'Network with 10 PMs and conduct informational interviews'] },
    { phase: 'Interview Prep', duration: 'Weeks 17-20', items: ['Practice 20+ product sense and estimation cases', 'Prepare a portfolio of 3 PRDs and strategy docs', 'Apply to 30+ PM roles with a metrics-driven resume'] },
  ],
};

const DEFAULT_ROADMAP = [
  { phase: 'Foundation', duration: 'Weeks 1-4', items: ['Identify 3 core skills to develop for your target role', 'Audit your current strengths and gaps honestly', 'Set up a learning schedule and accountability system'] },
  { phase: 'Core Skills', duration: 'Weeks 5-10', items: ['Complete a structured course or certification', 'Build a hands-on project applying new skills', 'Get feedback from a mentor or community'] },
  { phase: 'Specialization', duration: 'Weeks 11-16', items: ['Deepen expertise in one niche area', 'Create portfolio pieces that demonstrate impact', 'Network with 10 professionals in your target field'] },
  { phase: 'Interview Prep', duration: 'Weeks 17-20', items: ['Tailor your resume and online presence', 'Practice mock interviews weekly', 'Apply to 30+ roles and track your pipeline'] },
];

function pickRandom(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

/**
 * Local fallback: generate interview questions for a role.
 */
export function localInterviewQuestions(role) {
  return [
    ...pickRandom(QUESTION_BANK.behavioral, 3),
    ...pickRandom(QUESTION_BANK.technical, 3),
    ...pickRandom(QUESTION_BANK.situational, 2),
  ].map((q, i) => ({ id: i + 1, question: q, category: i < 3 ? 'Behavioral' : i < 6 ? 'Technical' : 'Situational' }));
}

/**
 * Local fallback: evaluate an answer.
 */
export function localEvaluateAnswer(question, answer, role) {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  let score = 50;
  if (words > 40) score += 15;
  if (words > 100) score += 10;
  if (words > 180) score += 5;
  if (/\b(because|therefore|as a result|which led to|outcome|impact|learned|improved)\b/i.test(answer)) score += 12;
  if (/\b(i\s+(led|built|designed|created|implemented|launched|optimized|reduced|increased))\b/i.test(answer)) score += 8;
  if (words < 15) score -= 20;
  score = Math.max(20, Math.min(98, score));

  const tips = [];
  if (words < 50) tips.push('Expand your answer with more specific detail and context.');
  if (!/\b(because|so|which|therefore|result)\b/i.test(answer)) tips.push('Use the STAR method: explain the Situation, Task, Action, and Result.');
  if (!/\d/.test(answer)) tips.push('Quantify your impact with metrics (e.g., "reduced latency by 40%").');
  if (tips.length === 0) tips.push('Strong, well-structured answer. Keep practicing to refine your delivery.');

  return {
    score,
    feedback: tips.join(' '),
    strengths: words > 80 ? ['Clear structure', 'Good level of detail'] : ['Concise and direct'],
    improvements: tips,
  };
}

/**
 * Local fallback: mentor chat response.
 */
export function localMentorResponse(message, profile) {
  const msg = message.toLowerCase();
  const name = profile?.name ? ` ${profile.name.split(' ')[0]}` : '';
  const target = profile?.target_role || 'your target role';

  // Basic programming language / tool cognizance check
  if (/\b(python|java|javascript|typescript|js|ts|sql|git|docker|kubernetes|html|css|react|node|api|supabase|tailwind)\b/.test(msg)) {
    if (/\b(python)\b/.test(msg)) {
      return `**Python** is a high-level, interpreted programming language known for its clear syntax and readability. It is widely used for web development, data science, artificial intelligence, automation, and general software engineering.`;
    }
    if (/\b(java)\b/.test(msg)) {
      return `**Java** is a class-based, object-oriented programming language designed to have as few implementation dependencies as possible ("write once, run anywhere"). It is widely used for enterprise applications, Android app development, and large-scale systems.`;
    }
    if (/\b(javascript|js)\b/.test(msg)) {
      return `**JavaScript** (JS) is a lightweight, interpreted programming language with first-class functions. It is best known as the scripting language for Web pages, but is also used in many non-browser environments like Node.js.`;
    }
    if (/\b(typescript|ts)\b/.test(msg)) {
      return `**TypeScript** is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. It compiles down to standard JavaScript.`;
    }
    if (/\b(sql)\b/.test(msg)) {
      return `**SQL** (Structured Query Language) is a standardized programming language used to manage relational databases and perform various operations on the data in them.`;
    }
    if (/\b(git)\b/.test(msg)) {
      return `**Git** is a distributed version control system designed to track changes in source code during software development, allowing multiple developers to work together collaboratively.`;
    }
    if (/\b(docker)\b/.test(msg)) {
      return `**Docker** is a platform designed to help developers build, share, run, and orchestrate containerized applications, separating the application from the infrastructure.`;
    }
    if (/\b(kubernetes|k8s)\b/.test(msg)) {
      return `**Kubernetes** (also known as K8s) is an open-source container orchestration system for automating software deployment, scaling, and management.`;
    }
    if (/\b(api)\b/.test(msg)) {
      return `An **API** (Application Programming Interface) is a set of rules and protocols that allows different software applications to communicate and exchange data with each other.`;
    }
    if (/\b(supabase)\b/.test(msg)) {
      return `**Supabase** is an open-source Firebase alternative providing a Postgres database, authentication, instant APIs, Edge Functions, and real-time subscriptions.`;
    }
    if (/\b(tailwind)\b/.test(msg)) {
      return `**Tailwind CSS** is a utility-first CSS framework designed to enable rapid UI development by applying low-level utility classes directly in your HTML/JSX markup.`;
    }
  }

  if (/\b(resume|cv)\b/.test(msg)) {
    return `Great question${name}! Your resume is your first impression. Here are key principles:\n\n1. **Quantify achievements** — instead of "improved performance", write "reduced API latency by 40%".\n2. **Tailor to the JD** — mirror keywords from the job description naturally.\n3. **Strong action verbs** — start bullets with Led, Built, Optimized, Architected.\n4. **Keep it skimmable** — recruiters spend ~6 seconds. Use clear sections and white space.\n5. **ATS-friendly** — avoid complex formatting, tables, or images that parsers can't read.\n\nYou can upload your resume in the Resume Analyzer and I'll give you specific, actionable feedback against any job description.`;
  }
  if (/\b(interview)\b/.test(msg)) {
    return `Interview prep is critical${name}. Here's my recommended approach for ${target} roles:\n\n1. **Research the company** — understand their product, values, and recent news.\n2. **Prepare STAR stories** — have 5-7 stories covering leadership, failure, conflict, and impact.\n3. **Practice out loud** — try the Mock Interview mode right here in the Dashboard.\n4. **Ask great questions** — prepare 3-4 thoughtful questions about the role and team.\n5. **Follow up** — send a concise thank-you email within 24 hours.\n\nWant to start a mock interview? I can ask you role-specific questions and give you instant feedback.`;
  }
  if (/skill|learn|study|roadmap|road\s*map/.test(msg)) {
    if (/\b(ai|ml|machine\s*learning|artificial\s*intelligence)\b/.test(msg)) {
      return `Here is a complete **AI/ML Learning Roadmap** ${name} to get you started on this path:\n\n` +
        `• **1. Python Programming & Libraries** — Master Python basics, NumPy, Pandas, and Matplotlib/Seaborn for data manipulation.\n` +
        `• **2. Mathematics & Statistics** — Learn Linear Algebra, Calculus, Probability, and Descriptive/Inferential Statistics.\n` +
        `• **3. Data Preparation & Feature Engineering** — Learn how to handle missing values, outliers, scaling, and encoding.\n` +
        `• **4. Machine Learning Models** — Build and evaluate Regression, Classification, and Clustering algorithms using Scikit-Learn.\n` +
        `• **5. Deep Learning & Neural Networks** — Learn CNNs, RNNs, Transformers, and frameworks like PyTorch or TensorFlow.\n\n` +
        `You can add this as a tracking item in your **Goals & Roadmap** page to track your progress week-by-week!`;
    }
    return `Skill-building is a journey${name}. For ${target}, I'd recommend a phased approach:\n\n1. **Audit your gaps** — compare your current skills to 5 job postings for ${target}.\n2. **Prioritize** — focus on the 2-3 skills that appear most often.\n3. **Learn by doing** — build projects, not just watch tutorials.\n4. **Get feedback** — share your work with communities or mentors.\n\nHead to the Goals & Roadmap page and I'll generate a personalized, week-by-week roadmap for you.`;
  }
  if (/\b(salary|negotiat|pay|comp)\b/.test(msg)) {
    return `Salary negotiation is a skill${name}. Key tips:\n\n1. **Research market rates** — use Levels.fyi, Glassdoor, and Blind for ${target} roles.\n2. **Don't anchor first** — let them make the offer, then negotiate up.\n3. **Total comp matters** — consider equity, bonus, benefits, not just base.\n4. **Have a number ready** — know your walk-away point before the conversation.\n5. **Be collaborative** — frame it as solving a problem together, not a demand.`;
  }
  if (/\b(career|switch|transition|change)\b/.test(msg)) {
    return `Career transitions are very doable with the right strategy${name}. Here's how:\n\n1. **Identify transferable skills** — map what you've done to what ${target} requires.\n2. **Fill the gaps** — take targeted courses or build projects in missing areas.\n3. **Network intentionally** — talk to people already in ${target} roles.\n4. **Reframe your story** — craft a narrative that connects your past to your future.\n5. **Start small** — consider side projects or freelance work to build credibility.\n\nWhat's your current background? I can help you map out the transition.`;
  }
  if (/\b(network|connect|linkedin)\b/.test(msg)) {
    return `Networking opens doors${name}. Effective strategies:\n\n1. **Optimize LinkedIn** — clear headline, professional photo, keyword-rich summary.\n2. **Engage before asking** — comment on posts, share insights, build visibility.\n3. **Informational interviews** — reach out with genuine curiosity, not a job ask.\n4. **Follow up** — send a thoughtful message after every conversation.\n5. **Give value first** — share articles, make introductions, offer help.`;
  }
  if (/\b(hello|hi|hey|start|help)\b/.test(msg)) {
    return `Hello${name}! I'm your AI Career Mentor. I can help you with:\n\n• **Resume optimization** — get ATS scores and actionable feedback\n• **Interview preparation** — practice with realistic mock interviews\n• **Skill roadmaps** — personalized week-by-step learning plans for ${target}\n• **Salary negotiation** — strategies to maximize your offer\n• **Career transitions** — navigate changing roles or industries\n\nWhat would you like to work on today?`;
  }
  return `That's a great thing to think about${name}. Here's my perspective:\n\nFor someone targeting ${target} roles, the key is consistent, deliberate practice combined with real-world application. Break your goal into smaller milestones, track your progress, and seek feedback regularly.\n\nCould you share a bit more about your specific situation? For example, your current experience level or the exact challenge you're facing — that'll help me give you more tailored advice. You can also try the Resume Analyzer or Mock Interview tools for hands-on practice.`;
}

/**
 * Local fallback: resume analysis.
 */
export function localAnalyzeResume(resumeText, jobDescription) {
  const resume = (resumeText || '').toLowerCase();
  const jd = (jobDescription || '').toLowerCase();

  // Extract skills present in JD
  const jdSkills = SKILL_LIBRARY.filter(s => jd.includes(s.toLowerCase()));
  const resumeSkills = SKILL_LIBRARY.filter(s => resume.includes(s.toLowerCase()));
  const missingSkills = jdSkills.filter(s => !resumeSkills.includes(s));
  const matchedSkills = jdSkills.filter(s => resumeSkills.includes(s));

  // ATS score calculation
  let atsScore = 55;
  if (matchedSkills.length > 0) atsScore += Math.min(25, matchedSkills.length * 5);
  if (resume.length > 1500) atsScore += 8;
  if (resume.length > 3000) atsScore += 5;
  if (/\b(experience|education|skills|project)\b/.test(resume)) atsScore += 7;
  if (missingSkills.length > 5) atsScore -= 10;
  if (jdSkills.length === 0) atsScore = 62; // no JD to compare
  atsScore = Math.max(35, Math.min(97, atsScore));

  const feedback = [];
  if (missingSkills.length > 0) feedback.push(`Add experience with: ${missingSkills.slice(0, 5).join(', ')}${missingSkills.length > 5 ? ' and more' : ''}. These appear in the job description but not your resume.`);
  if (resume.length < 1500) feedback.push('Your resume content seems short. Aim for 400-600 words with concrete achievements.');
  if (!/\d/.test(resumeText || '')) feedback.push('Quantify your achievements with numbers (e.g., "increased revenue by 25%", "managed a team of 8").');
  if (!/\b(led|built|designed|created|implemented|launched|optimized|developed|architected)\b/i.test(resumeText || '')) feedback.push('Use strong action verbs at the start of each bullet point.');
  feedback.push('Tailor your resume for each application by mirroring keywords from the job description naturally.');
  feedback.push('Ensure your contact information, LinkedIn, and GitHub/portfolio links are at the top.');

  const strengths = [];
  if (matchedSkills.length >= 3) strengths.push(`Strong match on ${matchedSkills.length} key skills: ${matchedSkills.slice(0, 4).join(', ')}`);
  if (resume.length > 2000) strengths.push('Good resume length with substantial detail.');
  if (/\b(led|built|designed|architected)\b/i.test(resumeText || '')) strengths.push('Uses strong action verbs effectively.');
  if (strengths.length === 0) strengths.push('Clear structure with relevant sections present.');

  return {
    atsScore,
    matchedSkills,
    missingSkills,
    strengths,
    feedback,
    summary: atsScore >= 75
      ? 'Your resume is well-aligned with this job description. Focus on the missing skills below and quantifying your impact to push your score even higher.'
      : atsScore >= 55
      ? 'Your resume has potential but needs refinement to match this role. Address the missing skills and strengthen your bullet points with quantified achievements.'
      : 'Your resume needs significant tailoring for this role. Focus on adding the missing skills, quantifying achievements, and aligning your content with the job description.',
  };
}

/**
 * Local fallback: generate a roadmap.
 */
export function localGenerateRoadmap(targetRole, currentSkills, timeline) {
  const role = (targetRole || '').toLowerCase();
  let template = DEFAULT_ROADMAP;
  for (const key of Object.keys(ROADMAP_TEMPLATES)) {
    if (role.includes(key)) { template = ROADMAP_TEMPLATES[key]; break; }
  }
  return {
    targetRole: targetRole || 'your target role',
    phases: template.map((p, i) => ({
      ...p,
      id: i + 1,
      milestones: p.items.map((item, j) => ({
        id: `${i + 1}-${j + 1}`,
        title: item,
        completed: false,
      })),
    })),
    estimatedWeeks: timeline || '20 weeks',
  };
}
