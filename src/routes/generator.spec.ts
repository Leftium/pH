import { describe, expect, it } from 'vitest';

import {
	createBookmarkletHref,
	decodeAddressFromHash,
	getInitialAddress
} from './Bookmarklet.gen.tsx';
import { copyToClipboard, formatCopyFeedback } from './Clipboard.gen.tsx';
import { getFormView } from './GeneratorForm.gen.tsx';
import { formatGeneratedPassword } from './GeneratedPassword.gen.tsx';
import { getConfirmationState, getConfirmationView } from './PasswordConfirmation.gen.tsx';

describe('bookmarklet', () => {
	it.each([
		['', ''],
		[
			'https%3A%2F%2Fexample.com%2Faccount%3Ftab%3Dsecurity',
			'https://example.com/account?tab=security'
		],
		['%E0%A4%A', '%E0%A4%A']
	])('decodes hash value %s', (hash, expectedAddress) => {
		expect(decodeAddressFromHash(hash)).toBe(expectedAddress);
	});

	it('creates an escaped bookmarklet URL', () => {
		expect(createBookmarkletHref('https://example.com/pH?mode="safe"')).toBe(
			"javascript:window.open(\"https://example.com/pH?mode=\\\"safe\\\"\"+'\\x23'+encodeURIComponent(location.href),'_blank','noopener')"
		);
	});

	it('uses the current hostname for a normal load', () => {
		expect(getInitialAddress('', 'ph.leftium.com')).toEqual({
			addressInput: 'ph.leftium.com',
			focusPassword: false
		});
	});

	it.each(['localhost', '127.0.0.1', '::1'])(
		'falls back to example.com when %s is not a password realm',
		(currentHostname) => {
			expect(getInitialAddress('', currentHostname)).toEqual({
				addressInput: 'example.com',
				focusPassword: false
			});
		}
	);

	it('prefers a bookmarklet address and shifts focus to the password', () => {
		expect(getInitialAddress('https://accounts.example.com/login', 'ph.leftium.com')).toEqual({
			addressInput: 'https://accounts.example.com/login',
			focusPassword: true
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
	])('classifies %s against abc', (confirmationInput, state, confirmationView) => {
		expect(getConfirmationState('abc', confirmationInput)).toEqual(state);
		expect(getConfirmationView('abc', confirmationInput)).toEqual(confirmationView);
	});

	it('does not retain an exact match after the source password changes', () => {
		expect(getConfirmationView('abc', 'abc').className).toBe('exact-match');
		expect(getConfirmationView('abd', 'abc').className).toBe('mismatch');
	});
});

describe('form presentation', () => {
	it('only reveals a missing password after submission', () => {
		expect(getFormView('example.com', '', false)).toMatchObject({
			generatedPassword: undefined,
			passwordMessage: { text: '', role: undefined },
			passwordAriaInvalid: undefined
		});
		expect(getFormView('example.com', '', true)).toMatchObject({
			passwordMessage: { text: 'Enter a master password.', role: 'alert' },
			passwordAriaInvalid: true
		});
	});

	it('does not provide a generated password when the address is invalid', () => {
		expect(getFormView('http://', 'secret', false)).toMatchObject({
			generatedPassword: undefined,
			addressMessage: { text: 'Enter a valid site address.', role: 'alert' },
			addressAriaInvalid: true
		});
	});
});

describe('generated password presentation', () => {
	it('masks the password with bullets until the field receives focus', () => {
		expect(formatGeneratedPassword('4QAIn8SvaW', false)).toBe('4Q••••••••');
		expect(formatGeneratedPassword('4QAIn8SvaW', true)).toBe('4QAIn8SvaW');
		expect(formatGeneratedPassword(undefined, false)).toBe('');
	});
});

describe('clipboard', () => {
	it('returns Ok after the injected writer accepts the generated password', async () => {
		const writes: string[] = [];
		const copyResult = await copyToClipboard(
			(text) => Promise.resolve(writes.push(text)).then(() => {}),
			'secret'
		);

		expect(writes).toEqual(['secret']);
		expect(copyResult).toEqual({ TAG: 'Ok', _0: undefined });
	});

	it('maps an injected writer rejection to CopyFailed', async () => {
		const copyResult = await copyToClipboard(() => Promise.reject(new Error('denied')), 'secret');

		expect(copyResult).toEqual({ TAG: 'Error', _0: 'CopyFailed' });
	});

	it('formats masked feedback for completed copy operations', () => {
		expect(formatCopyFeedback({ TAG: 'Ok', _0: undefined }, '4QAIn8SvaW')).toBe(
			'Copied 4Q••••••••.'
		);
		expect(formatCopyFeedback({ TAG: 'Error', _0: 'CopyFailed' }, '4QAIn8SvaW')).toBe(
			'Could not copy 4Q••••••••. Try again.'
		);
	});
});
