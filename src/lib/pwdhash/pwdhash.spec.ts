import { describe, expect, it } from 'vitest';

import { createBookmarkletHref, decodeBookmarkletHash } from './Bookmarklet.gen.tsx';
import { getConfirmationState, presentConfirmation } from './Confirmation.gen.tsx';
import { copyToClipboard, presentCopyFeedback } from './Clipboard.gen.tsx';
import { presentForm } from './Form.gen.tsx';
import { presentGeneratedPassword } from './GeneratedPassword.gen.tsx';
import { generatePassword } from './Password.gen.tsx';
import { resolve } from './Realm.gen.tsx';

describe('bookmarklet', () => {
	it.each([
		['', ''],
		[
			'https%3A%2F%2Fexample.com%2Faccount%3Ftab%3Dsecurity',
			'https://example.com/account?tab=security'
		],
		['%E0%A4%A', '%E0%A4%A']
	])('decodes hash value %s', (hash, expected) => {
		expect(decodeBookmarkletHash(hash)).toBe(expected);
	});

	it('creates an escaped bookmarklet URL', () => {
		expect(createBookmarkletHref('https://example.com/pH?mode="safe"')).toBe(
			"javascript:window.open(\"https://example.com/pH?mode=\\\"safe\\\"\"+'\\x23'+encodeURIComponent(location.href),'_blank','noopener')"
		);
	});
});

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
		['', 'Empty', { className: 'neutral', message: undefined, ariaInvalid: undefined }],
		[
			'a',
			'MatchingPrefix',
			{ className: 'matching-prefix', message: 'Passwords match so far.', ariaInvalid: undefined }
		],
		[
			'abc',
			'ExactMatch',
			{ className: 'exact-match', message: 'Passwords match.', ariaInvalid: false }
		],
		[
			'ax',
			'Mismatch',
			{ className: 'mismatch', message: 'Passwords do not match.', ariaInvalid: true }
		]
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
			generatedPassword: undefined,
			passwordMessage: { text: '', role: undefined },
			passwordAriaInvalid: undefined
		});
		expect(presentForm('example.com', '', true)).toMatchObject({
			passwordMessage: { text: 'Enter a master password.', role: 'alert' },
			passwordAriaInvalid: true
		});
	});

	it('does not provide a generated password when the domain is invalid', () => {
		expect(presentForm('http://', 'secret', false)).toMatchObject({
			generatedPassword: undefined,
			domainMessage: { text: 'Enter a valid site address.', role: 'alert' },
			domainAriaInvalid: true
		});
	});
});

describe('generated password presentation', () => {
	it('masks the password with bullets until the field receives focus', () => {
		expect(presentGeneratedPassword('4QAIn8SvaW', false)).toEqual({ value: '4Q••••••••' });
		expect(presentGeneratedPassword('4QAIn8SvaW', true)).toEqual({ value: '4QAIn8SvaW' });
		expect(presentGeneratedPassword(undefined, false)).toEqual({ value: '' });
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

	it('presents masked feedback for completed copy operations', () => {
		expect(presentCopyFeedback({ TAG: 'Ok', _0: undefined }, '4QAIn8SvaW')).toBe(
			'Copied 4Q••••••••.'
		);
		expect(presentCopyFeedback({ TAG: 'Error', _0: 'CopyFailed' }, '4QAIn8SvaW')).toBe(
			'Could not copy 4Q••••••••. Try again.'
		);
	});
});
