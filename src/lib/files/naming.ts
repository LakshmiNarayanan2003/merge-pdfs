export function outputName(input: string): string {
  const stem = input
    .normalize('NFKC')
    .replace(/(?:\.pdf)+$/i, '')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\p{Cc}/gu, '-')
    .replace(/^[.\s-]+|[.\s-]+$/g, '')
    .slice(0, 120)
    .trim();
  return `${stem && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(stem) ? stem : 'merged'}.pdf`;
}
export function formatBytes(bytes: number) {
  return bytes < 1048576
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1048576).toFixed(1)} MB`;
}
