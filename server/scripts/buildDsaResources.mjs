import fs from 'node:fs';
import { curriculumCatalog } from '../../shared/dsaCurriculum.mjs';
import { visualLessons } from '../../shared/dsaVisualLessons.mjs';
const index=JSON.parse(fs.readFileSync(new URL('../../shared/dsaExternalIndex.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const topicVideos={basics:'palindrome-number',sorting:'sort-an-array',arrays:'two-sum',strings:'valid-anagram',hashing:'group-anagrams','two-pointers':'valid-palindrome','sliding-window':'longest-substring-without-repeating-characters','linked-list':'reverse-linked-list','stack-queue':'valid-parentheses','binary-search':'binary-search',recursion:'subsets',trees:'maximum-depth-of-binary-tree',bst:'validate-binary-search-tree',heap:'kth-largest-element-in-an-array',greedy:'jump-game',graphs:'number-of-islands','dynamic-programming':'climbing-stairs',tries:'implement-trie-prefix-tree','bit-manipulation':'number-of-1-bits','advanced-problems':'lru-cache'};
const resources={};
for(const q of [...Object.values(curriculumCatalog).flat(),...visualLessons]) {
  const match=index.find(p=>q.referenceSlug?p.link.replace(/\/$/,'')===q.referenceSlug:normalize(p.problem)===normalize(q.title));
  const video=match?.video?match:index.find(p=>p.link.replace(/\/$/,'')===topicVideos[q.topic]);
  const sourceUrl=q.sourceUrl||(q.referenceSlug?`https://leetcode.com/problems/${q.referenceSlug}/`:match?`https://leetcode.com/problems/${match.link}`:null);
  resources[`${q.topic}:${q.id}`]={sourceUrl,sourceLabel:sourceUrl?.includes('codechef')?'Related CodeChef problem':'Related LeetCode problem',videoUrl:video?.video?`https://www.youtube.com/watch?v=${video.video}`:null,videoTitle:video?.problem||null,videoScope:match?.video?'problem':'related topic',youtubeSearch:`https://www.youtube.com/results?search_query=${encodeURIComponent(q.title+' algorithm explanation')}`};
}
fs.writeFileSync(new URL('../../shared/dsaResources.mjs',import.meta.url),`// Resource links from NeetCode's public problem index, checked 2026-10-07.\n// https://github.com/neetcode-gh/leetcode/blob/main/.problemSiteData.json\nexport const dsaResources = ${JSON.stringify(resources,null,2)};\n`);
console.log({problems:Object.keys(resources).length,linkedSources:Object.values(resources).filter(r=>r.sourceUrl).length,videos:Object.values(resources).filter(r=>r.videoUrl).length});
