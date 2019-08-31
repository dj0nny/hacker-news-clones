#!/usr/bin/env node

const axios = require('axios');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (!process.env.GITHUB_TOKEN) {
  throw new Error('Github token environment variable needs to be specified.');
}

axios.defaults.baseURL = 'https://api.github.com';
axios.defaults.headers.common['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;

const PLACEHOLDER = 'INSERT HERE THE REPOSITORIES';
const REPOSITORIES = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '/templates/repositories.yml'), 'utf8'));

(async () => {
 await main();
})();

async function main() {
  const input = fs.readFileSync(path.join(process.cwd(), 'README.template.md'), 'utf8').split('\n');
  const output = [
    '<!-- ',
    '      NOTE: This file is autogenerated!!!',
    '            Please do not directly edit this file.',
    '            Instead, please edit: README.template.md',
    '-->',
  ];
  for (let i = 0; i < input.length; i++) {
    if (input[i].includes(PLACEHOLDER)) {
      output.push(...(await generateTables(REPOSITORIES)));
    } else {
      output.push(input[i]);
    }
  }

  fs.writeFileSync(path.join(process.cwd(), 'README.md'), output.join('\n'));
  console.log(`Wrote the output file`);
}

async function generateTables(repos) {
  for (let i = 0; i < repos.length; i++) {
    const res = await axios.get(`/repos/${repos[i].repo}`);
    const stargazers_count = res.data.stargazers_count;
    repos[i].stargazers_count = stargazers_count;
  }
  repos = repos.sort((index1, index2) => index2.stargazers_count - index1.stargazers_count);
  console.log('\n\nSorted repos: \n\n' + repos.map(e => `  ${e.repo} (${e.stargazers_count})`).join('\n') + '\n\n');

  const output = [];

  output.push('<!--');
  output.push('  Ranking:');
  const repoRankings = repos.map((e, i) => 
    `    ${(i+1).toString().padStart(2)}: ${e.title}`);
  output.push(...repoRankings);
  output.push('-->');

  output.push(...[
    '| Angular | React | Vue |',
    '| :---:         |     :---:      |          :---: |',
  ]);


  let string = '';
  for (let i = 0; i < repos.length; ++i) {
    string += `| [**${repos[i].title}**<br/> ` +
      `<img src="${repos[i].logo}" title="${repos[i].title}" style="width:40%;display:block" />` +
      `![Star](https://img.shields.io/github/stars/${repos[i].repo}.svg?style=social&label=Star) ` +
      `![Fork](https://img.shields.io/github/forks/${repos[i].repo}.svg?style=social&label=Fork)]` +
      `(https://github.com/${repos[i].repo})`;
    if (!((i + 1) % 3)) {
      output.push(string);
      string = '';
    }
  }
  output.push(string);
  return output;
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  throw new Error(reason);
});