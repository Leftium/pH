import { describe, expect, it } from 'vitest';

import { generatePassword } from './Password.gen.tsx';
import { resolve } from './Realm.gen.tsx';

describe('domain extraction', () => {
	it.each([
		[' https://www.example.com ', 'example.com'],
		['http://sub.example.co.uk/path?q=1', 'example.co.uk'],
		['HTTPS://WWW.Example.COM:443/path', 'example.com'],
		['//www.example.com/path', 'example.com'],
		['foo.blogspot.com', 'blogspot.com'],
		['foo.example.org.ru', 'org.ru'],
		['a.example.com', 'example.com'],
		['b.example.com', 'example.com']
	])('resolves the registrable domain for %s', (addressInput, realm) => {
		expect(resolve(addressInput)).toEqual({ TAG: 'Ok', _0: realm });
	});

	it.each(['', '   '])('returns MissingAddress for an empty site address', (addressInput) => {
		expect(resolve(addressInput)).toEqual({ TAG: 'Error', _0: 'MissingAddress' });
	});

	it.each(['http://', 'not a host', 'foo.example.invalid', '127.0.0.1'])(
		'rejects invalid site addresses',
		(addressInput) => {
			expect(resolve(addressInput)).toEqual({ TAG: 'Error', _0: 'InvalidAddress' });
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
