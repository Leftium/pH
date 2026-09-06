import { describe, expect, it } from 'vitest';

import { getConfirmationState, presentConfirmation } from './Confirmation.gen.tsx';
import { copyFeedbackMessage, copyToClipboard } from './Clipboard.gen.tsx';
import { presentForm } from './Form.gen.tsx';
import { generatePassword } from './Password.gen.tsx';
import { resolve } from './Realm.gen.tsx';

describe('domain extraction', () => {
	it.each([
		[' https://www.example.com ', 'example.com'],
		['http://sub.example.co.uk/path?q=1', 'example.co.uk'],
		['HTTPS://WWW.Example.COM:443/path', 'example.com'],
		['//www.example.com/path', 'example.com'],
		['foo.blogspot.com', 'blogspot.com'],
		['foo.example.org.ru', 'example.org.ru'],
		['a.example.com', 'example.com'],
		['b.example.com', 'example.com']
	])('uses a normalized two-label realm for %s', (input, expected) => {
		expect(resolve(input)).toEqual({ TAG: 'Ok', _0: expected });
	});

	it.each(['', '   '])('returns MissingAddress for an empty site address', (input) => {
		expect(resolve(input)).toEqual({ TAG: 'Error', _0: 'MissingAddress' });
	});

	it.each(['http://', 'not a host', 'foo.example.invalid', '127.0.0.1'])(
		'rejects invalid site addresses',
		(input) => {
			expect(resolve(input)).toEqual({ TAG: 'Error', _0: 'InvalidAddress' });
		}
	);

	it('generates the same password for different subdomains', () => {
		expect(generatePassword('a.example.com', 'password')).toEqual(
			generatePassword('b.example.com', 'password')
		);
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
		['', 'Empty', { className: 'neutral', message: undefined }],
		['a', 'MatchingPrefix', { className: 'matching-prefix', message: 'Passwords match so far.' }],
		['abc', 'ExactMatch', { className: 'exact-match', message: 'Passwords match.' }],
		['ax', 'Mismatch', { className: 'mismatch', message: 'Passwords do not match.' }]
	])('classifies %s against abc', (confirmation, state, presentation) => {
		expect(getConfirmationState('abc', confirmation)).toEqual(state);
		expect(presentConfirmation('abc', confirmation)).toEqual(presentation);
	});

	it('does not retain an exact match after the source password changes', () => {
		expect(presentConfirmation('abc', 'abc').className).toBe('exact-match');
		expect(presentConfirmation('abd', 'abc').className).toBe('mismatch');
	});
});

describe('form presentation', () => {
	it('only reveals a missing password after submission', () => {
		expect(presentForm('example.com', '', false)).toMatchObject({
			resolvedDomain: 'example.com',
			generatedPassword: undefined,
			passwordError: undefined
		});
		expect(presentForm('example.com', '', true).passwordError).toBe('Enter a master password.');
	});

	it('does not provide a generated password when the domain is invalid', () => {
		expect(presentForm('http://', 'secret', false)).toMatchObject({
			generatedPassword: undefined,
			domainError: 'Enter a valid site address.'
		});
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
		expect(copyFeedbackMessage(result)).toBe(
			'Copy failed. Use the generated-password field instead.'
		);
	});
});
