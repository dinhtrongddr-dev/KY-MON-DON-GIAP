import test from 'node:test';
import assert from 'node:assert/strict';
import {formatParts,formatError,renderProse} from '../dist/reading-format.mjs';
class Node {
  constructor(tag){this.tag=tag;this.children=[];this.value='';}
  append(...xs){this.children.push(...xs);}
  set textContent(v){this.value=v;this.children=[];}
  get textContent(){return this.value+this.children.map(x=>x.textContent).join('');}
}
const doc={createElement:tag=>new Node(tag)};
test('bold preserves all words, qualifiers, Vietnamese and line breaks',()=>{
  const text='Kim khắc Mộc. **Nếu điều kiện được xác nhận, mới có thể tiến thêm bước**.\nSinh Môn còn cần xét Tuần Không.';
  const parts=formatParts(text);
  assert.equal(parts.map(p=>p.text).join(''),text.replaceAll('**',''));
  assert.deepEqual(parts.filter(p=>p.strong).map(p=>p.text),['Nếu điều kiện được xác nhận, mới có thể tiến thêm bước']);
  assert.equal(formatError(text),null);
  assert.ok(formatError('Cần **xác minh lại.'));
  assert.ok(formatError('Nếu có phản hồi, **chắc chắn ký**.'));
});
test('safe DOM rendering supports line breaks and tables without interpreting model HTML',()=>{
  const root=new Node('div');
  renderProse('**Cần xác nhận lại điều kiện trước khi hứa**.\n<script>alert(1)</script>\n\n| Môn | Ý nghĩa |\n| --- | --- |\n| Sinh Môn | Có thể mở việc |',root,doc);
  const all=[];const visit=n=>{all.push(n);n.children.forEach(visit);};visit(root);
  assert.ok(all.some(n=>n.tag==='strong'));
  assert.ok(all.some(n=>n.tag==='table'));
  assert.ok(!all.some(n=>n.tag==='script'||n.tag==='a'));
  assert.ok(root.textContent.includes('<script>alert(1)</script>'));
  assert.ok(root.textContent.includes('Sinh Môn'));
  assert.ok(!root.textContent.includes('**'));
});
test('unmarked verified prose gets only existing meaning emphasized',()=>{
  const text='Khai Môn ở cung đại diện. Chưa đủ căn cứ để kết luận thành công. Hãy xác nhận điều kiện còn thiếu.';
  const parts=formatParts(text);
  assert.equal(parts.map(p=>p.text).join(''),text);
  assert.ok(parts.some(p=>p.strong&&p.text.startsWith('Chưa')));
});
