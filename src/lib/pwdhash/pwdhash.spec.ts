import { describe, expect, it } from 'vitest';

import { confirmationClass, getConfirmationState } from './Confirmation.gen.tsx';
import { copyToClipboard } from './Clipboard.gen.tsx';
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

describe('confirmation', () => {
	it.each([
		['', 'Empty', 'neutral'],
		['a', 'MatchingPrefix', 'matching-prefix'],
		['abc', 'ExactMatch', 'exact-match'],
		['ax', 'Mismatch', 'mismatch']
	])('classifies %s against abc', (confirmation, state, className) => {
		expect(getConfirmationState('abc', confirmation)).toEqual(state);
		expect(confirmationClass('abc', confirmation)).toBe(className);
	});

	it('does not retain an exact match after the source password changes', () => {
		expect(confirmationClass('abc', 'abc')).toBe('exact-match');
		expect(confirmationClass('abd', 'abc')).toBe('mismatch');
	});
});

describe('clipboard', () => {
	it('returns Ok after the injected writer accepts the generated password', async () => {
		const writes: string[] = [];
		const result = await copyToClipboard(
			(text) => Promise.resolve(writes.push(text)).then(() => {}),
			'secret'
		);

		expect(writes).toEqual(['secret']);
		expect(result).toEqual({ TAG: 'Ok', _0: undefined });
	});

	it('maps an injected writer rejection to CopyFailed', async () => {
		const result = await copyToClipboard(() => Promise.reject(new Error('denied')), 'secret');

		expect(result).toEqual({ TAG: 'Error', _0: 'CopyFailed' });
	});
});
