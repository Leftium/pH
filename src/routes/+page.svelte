<script lang="ts">
	import { extractDomain } from '#lib/pwdhash/DomainExtractor.gen.tsx';

	const extractedDomain = extractDomain('https://www.example.com');
</script>

<h1>pH v2</h1>
<p>Generated ReScript output: {extractedDomain}</p>
