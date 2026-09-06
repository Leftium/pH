import { parse } from 'tldts-icann';

export function parseAddress(input) {
	const address = input.trim();
	const normalizedAddress = address.startsWith('//') ? `https:${address}` : address;
	const parsed = parse(normalizedAddress, { detectSpecialUse: true });

	if (
		parsed.domain === null ||
		parsed.hostname === null ||
		parsed.isIp ||
		parsed.publicSuffix === 'invalid'
	) {
		return null;
	}

	return { domain: parsed.domain, hostname: parsed.hostname };
}
