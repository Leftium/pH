import { describe, expect, it } from 'vitest';

import { extractDomain } from './DomainExtractor.gen.tsx';
import { generatePassword } from './Password.gen.tsx';

describe('domain extraction', () => {
	it.each([
		['https://www.example.com', 'example.com'],
		['http://sub.example.co.uk/path?q=1', 'example.co.uk'],
		['HTTPS://WWW.Example.COM/path', 'HTTPS:'],
		['foo.blogspot.com', 'blogspot.com'],
		['foo.example.invalid', 'example.invalid'],
		['localhost', 'localhost'],
		['not a host', 'not a host']
	])('matches the v1 extractor for %s', (input, expected) => {
		expect(extractDomain(input)).toEqual({ TAG: 'Ok', _0: expected });
	});

	it.each(['', '   '])('returns MissingDomain for an empty domain input', (input) => {
		expect(extractDomain(input)).toEqual({ TAG: 'Error', _0: 'MissingDomain' });
	});

	it('turns a non-empty legacy extractor failure into DomainExtractionFailed', () => {
		expect(extractDomain('http://')).toEqual({ TAG: 'Error', _0: 'DomainExtractionFailed' });
	});
});

describe('password generation', () => {
	it('matches the v1 hash path fixture', () => {
		expect(generatePassword('https://www.example.com', 'password')).toEqual({
			TAG: 'Ok',
			_0: '4QAIn8SvaW'
		});
		expect(generatePassword('http://sub.example.co.uk/path?q=1', 'hunter2')).toEqual({
			TAG: 'Ok',
			_0: 'KhuVaBms0'
		});
	});

	it('passes @@ literally to the legacy hash adapter', () => {
		expect(generatePassword('https://www.example.com', '@@password')).toEqual({
			TAG: 'Ok',
			_0: 'JA+7KwbcAX3U'
		});
	});
});
