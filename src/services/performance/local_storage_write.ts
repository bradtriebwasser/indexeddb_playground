import {generateString, generateRandomString, fakeGithubResponse} from 'services/mock_data';
import {PerformanceTestCase} from 'services/performance/performance';

function benchmarkWrite(
  iteration: number,
  blob: string | object,
  isJSON = false
) {
  localStorage.clear();
  const start = performance.now();
  for (let i = 0; i < iteration; ++i) {
    let data = isJSON ? JSON.stringify(blob) : blob;
    localStorage.setItem(`doc_${i}`, data as string);
  }
  const end = performance.now();
  localStorage.clear();
  return Promise.resolve(end - start);
}

function benchmarkWriteRandom(
  iteration: number,
  byteseach: number,
  isJSON = false
) {
  let values = [];
  for (let i = 0; i < iteration; ++i) {
    values.push(generateRandomString(byteseach));
  }

  const start = performance.now();
  for (let i = 0; i < iteration; ++i) {
    localStorage.setItem(`doc_${i}`, values[i]);
  }
  const end = performance.now();
  return Promise.resolve(end - start);
}


const baseCase = {
  iteration: 100,
};

const write1MB: PerformanceTestCase = {
  ...baseCase,
  name: 'localStorageWrite1MB',
  label: 'localStorage write 1MB',
  benchmark: () => benchmarkWrite(1, generateString(1024)),
};

const write1KB: PerformanceTestCase = {
  ...baseCase,
  name: 'localStorageWrite1KB',
  label: 'localStorage write 1KB',
  benchmark: () => benchmarkWrite(1, generateString(1)),
};

const writeJSON: PerformanceTestCase = {
  ...baseCase,
  name: 'localStorageWriteJSON',
  label: 'localStorage write 70KB JSON',
  benchmark: () => benchmarkWrite(1, fakeGithubResponse, true),
};

const write1024x100B: PerformanceTestCase = {
  ...baseCase,
  name: 'localStorageWrite1024x10KB',
  label: 'localStorage write a bunch of random data',
  benchmark: () => benchmarkWriteRandom(102, 10),
};

const write100x1KB: PerformanceTestCase = {
  ...baseCase,
  name: 'localStorageWrite100x1KB',
  label: 'localStorage write 100x1KB',
  benchmark: () => benchmarkWrite(100, generateString(1)),
};

export const localStorageWriteTestCases = [
  write1MB,
  write1KB,
  write1024x100B,
  write100x1KB,
  writeJSON,
];
