export const aptitudeCategories = [
  { category: 'Quantitative Aptitude', topics: ['Percentages', 'Profit & Loss', 'Ratio & Proportion', 'Average', 'Time & Work', 'Time, Speed & Distance', 'Probability', 'Number System'] },
  { category: 'Logical Reasoning', topics: ['Coding Decoding', 'Blood Relations', 'Direction Sense', 'Seating Arrangement', 'Syllogism', 'Series'] },
  { category: 'Verbal Ability', topics: ['Reading Comprehension', 'Grammar', 'Vocabulary', 'Sentence Correction', 'Para Jumbles'] }
];
export const csTopics = ['OOP', 'DBMS', 'Operating Systems', 'Computer Networks', 'SQL', 'System Design', 'Git & GitHub', 'Linux', 'Cloud Basics'];
export const aptitudeQuestions = {
  Percentages: [
    { id: 'p1', prompt: 'What is 20% of 250?', options: ['25', '40', '50', '75'], answer: 2 },
    { id: 'p2', prompt: 'A value increases from 80 to 100. What is the percentage increase?', options: ['20%', '25%', '40%', '80%'], answer: 1 },
    { id: 'p3', prompt: 'After a 10% discount, an item costs ₹450. What was its original price?', options: ['₹495', '₹500', '₹540', '₹550'], answer: 1 }
  ],
  'Time & Work': [
    { id: 'tw1', prompt: 'A job takes 10 days for one person. What fraction is completed in one day?', options: ['1/5', '1/10', '1/20', '10'], answer: 1 },
    { id: 'tw2', prompt: 'If A completes work in 6 days, A’s one-day work is:', options: ['1/3', '1/6', '6', '3'], answer: 1 }
  ],
  'Coding Decoding': [
    { id: 'cd1', prompt: 'If CAT is coded as DBU, how is DOG coded using the same rule?', options: ['EPH', 'CNG', 'DOH', 'FPG'], answer: 0 },
    { id: 'cd2', prompt: 'In a code, each letter moves one place backward. What does IFMMP become?', options: ['HELLO', 'JGNNQ', 'GDKKN', 'IFMMP'], answer: 0 }
  ]
};
export const companies = [
  { name: 'Amazon', dsa: 'High', focus: ['Arrays', 'Trees', 'Graphs', 'Dynamic Programming'], rounds: ['Online assessment', 'Technical interviews', 'Behavioral'] },
  { name: 'Microsoft', dsa: 'Medium–High', focus: ['Arrays', 'Trees', 'Linked Lists', 'OOP'], rounds: ['Online assessment', 'Technical interviews'] },
  { name: 'TCS', dsa: 'Foundation', focus: ['Aptitude', 'Arrays', 'OOP', 'SQL'], rounds: ['Aptitude', 'Technical interview', 'HR'] }
];
