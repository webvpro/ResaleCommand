import { marked } from 'marked';
try {
  console.log(marked('# hello'));
} catch (e) {
  console.error("Error with marked():", e.message);
}
try {
  console.log(marked.parse('# hello'));
} catch (e) {
  console.error("Error with marked.parse():", e.message);
}
