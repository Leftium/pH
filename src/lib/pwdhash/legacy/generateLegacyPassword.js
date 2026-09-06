import { SPH_HashedPassword } from './hashed-password.js';

export function generateLegacyPassword(password, domain) {
	return String(new SPH_HashedPassword(password, domain));
}
