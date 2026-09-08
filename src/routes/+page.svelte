<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { getConfirmationView } from './PasswordConfirmation.gen.tsx';
	import { copyToClipboard, formatCopyFeedback } from './Clipboard.gen.tsx';
	import { createBookmarkletHref, decodeAddressFromHash } from './Bookmarklet.gen.tsx';
	import { getFormView } from './GeneratorForm.gen.tsx';
	import { formatGeneratedPassword } from './GeneratedPassword.gen.tsx';

	let addressInput = $state('');
	let masterPassword = $state('');
	let confirmationInput = $state('');
	let hasSubmitted = $state(false);
	let revealGeneratedPassword = $state(false);
	let copyFeedback = $state('');
	let isCopyPending = $state(false);
	let bookmarkletHref = $state('');
	let addressInputElement: HTMLInputElement;
	let passwordInputElement: HTMLInputElement;

	let form = $derived(getFormView(addressInput, masterPassword, hasSubmitted));
	let generatedPassword = $derived(
		formatGeneratedPassword(form.generatedPassword, revealGeneratedPassword)
	);
	let confirmation = $derived(getConfirmationView(masterPassword, confirmationInput));

	async function copyGeneratedPassword() {
		hasSubmitted = true;
		if (isCopyPending || form.generatedPassword === undefined) {
			return;
		}

		const generatedPassword = form.generatedPassword;
		isCopyPending = true;
		copyFeedback = '';
		const copyResult = await copyToClipboard(
			(text) => navigator.clipboard.writeText(text),
			generatedPassword
		);
		copyFeedback = formatCopyFeedback(copyResult, generatedPassword);
		isCopyPending = false;
	}

	function handlePasswordKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			void copyGeneratedPassword();
		}
	}

	onMount(() => {
		const generatorUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
		bookmarkletHref = createBookmarkletHref(generatorUrl);
		const addressFromHash = decodeAddressFromHash(window.location.hash.slice(1));
		addressInput = addressFromHash;
		(addressFromHash === '' ? addressInputElement : passwordInputElement).focus();
	});
</script>

<svelte:head>
	<title>PwdHash Generator</title>
</svelte:head>

<article>
	<header>
		<h1>PwdHash Generator</h1>
		<p>Generates theft-resistant passwords.</p>
	</header>

	<div class="generator-controls">
		<label>
			Site Address
			<input
				autocomplete="url"
				placeholder="https://example.com"
				aria-invalid={form.addressAriaInvalid}
				bind:value={addressInput}
				bind:this={addressInputElement}
			/>
			<small><span role={form.addressMessage.role}>{form.addressMessage.text}</span></small>
		</label>

		<!-- Enpass skips Enter capture when an identifying attribute contains "search". -->
		<label>
			Master Password
			<input
				type="password"
				autocomplete="off"
				class="enpass-search-bypass"
				aria-invalid={form.passwordAriaInvalid}
				bind:value={masterPassword}
				bind:this={passwordInputElement}
				onkeydown={handlePasswordKeydown}
			/>
			<small><span role={form.passwordMessage.role}>{form.passwordMessage.text}</span></small>
		</label>

		<label>
			Confirm Master Password <em>(Optional)</em>
			<input
				type="password"
				autocomplete="off"
				class={`enpass-search-bypass ${confirmation.className ?? ''}`}
				aria-invalid={confirmation.ariaInvalid}
				bind:value={confirmationInput}
				onkeydown={handlePasswordKeydown}
			/>
			<small aria-live="polite">{confirmation.message}</small>
		</label>

		<label>
			Generated Password
			<input
				class="generated-password"
				readonly
				autocomplete="off"
				value={generatedPassword}
				onfocus={async (event) => {
					const input = event.currentTarget;
					revealGeneratedPassword = true;
					await tick();
					input.select();
				}}
				onblur={() => (revealGeneratedPassword = false)}
			/>
			<small>{copyFeedback}</small>
		</label>
		<button type="button" disabled={isCopyPending} onclick={() => void copyGeneratedPassword()}
			>Copy</button
		>
	</div>

	<footer>
		<span class="bookmarklet">
			Bookmarklet: <a href={bookmarkletHref}>pH</a>
			<span class="bookmarklet-tooltip">Drag to your bookmarks bar.</span>
		</span>
		<span aria-hidden="true"> &middot; </span>
		<a href="https://github.com/Leftium/pH">Source on GitHub</a>
	</footer>
</article>

<style>
	article > header,
	article > footer {
		text-align: center;
	}

	.matching-prefix {
		background: light-dark(#fff7cc, oklch(0.3 0.05 90));
	}

	input[aria-invalid='false'] {
		background: light-dark(#ddf7df, oklch(0.3 0.05 145));
	}

	input[aria-invalid='true'] {
		background: light-dark(#ffe1e6, oklch(0.3 0.05 25));
	}

	input[type='password'],
	.generated-password {
		font-family: ui-monospace, 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
	}

	.generator-controls small {
		min-height: 1.5rem;
	}

	.generator-controls > button {
		width: 100%;
	}

	.bookmarklet {
		position: relative;
	}

	.bookmarklet-tooltip {
		position: absolute;
		bottom: calc(100% + 0.5rem);
		left: 0;
		z-index: 1;
		width: max-content;
		max-width: min(18rem, calc(100vw - 3rem));
		padding: 0.35rem 0.5rem;
		border-radius: 0.25rem;
		background: #1f2937;
		color: white;
		font-size: 0.875rem;
		opacity: 0;
		pointer-events: none;
		transform: translateY(0.25rem);
		transition:
			opacity 0.1s,
			transform 0.1s;
	}

	.bookmarklet a:hover + .bookmarklet-tooltip,
	.bookmarklet:focus-within .bookmarklet-tooltip {
		opacity: 1;
		transform: translateY(0);
	}
</style>
