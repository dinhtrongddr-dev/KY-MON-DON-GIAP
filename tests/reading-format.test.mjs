import test from 'node:test';
import assert from 'node:assert/strict';
import {formatParts,formatError,renderProse,sectionMeaning,sectionTechnicalText,sectionText,renderReadingSection} from '../dist/reading-format.mjs';
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
  assert.ok(formatError('Nếu chỉ so ba lựa chọn, **20/09 phù hợp nhất**.'));
  assert.equal(formatError('Nếu chỉ so ba lựa chọn, **20/09 phù hợp nhất**.',{allowComparisonEmphasis:true}),null);
  assert.ok(formatError('Nếu chỉ so ba lựa chọn, **chắc chắn ký**.',{allowComparisonEmphasis:true}));
  assert.equal(formatError('**20/09** hoặc **21/09**; **19/09 xếp sau**.',{allowComparisonEmphasis:true}),null);
  assert.ok(formatError('**20/09** **21/09** **19/09** **18/09**.',{allowComparisonEmphasis:true}));
});
test('technical Kỳ Môn basis can never be bold; natural translated meaning can',()=>{
  const bad='Cha mẹ và **gia đình gốc trước hết lấy Niên can Giáp tại Tốn 4 hành Mộc làm trục tổng hợp**.';
  assert.match(formatError(bad),/dịch nghĩa tự nhiên.*căn cứ kỹ thuật/i);
  const good='Cha mẹ và gia đình gốc trước hết lấy Niên can Giáp tại Tốn 4 hành Mộc làm trục tổng hợp. **Nền gia đình thiên về kết nối và thích nghi, nhưng cần tránh để môi trường chi phối quá mạnh.**';
  assert.equal(formatError(good),null);
  const auto=formatParts('Cần xét Khai Môn tại cung 6 trước khi kết luận. Có thể ưu tiên cách làm rõ ràng và dễ kiểm chứng.');
  assert.ok(!auto.some(p=>p.strong&&/Khai Môn|cung 6/.test(p.text)));
  assert.ok(auto.some(p=>p.strong&&/Có thể ưu tiên/.test(p.text)));
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

test('technical Kỳ Môn prefix is separable from the translated meaning without changing text order',()=>{
  const text='Càn 6 có Thiên Xung + Hưu Môn, gặp Môn bức cung. **Cách triển khai có lực thúc đẩy nhưng dễ bị quy trình bó lại.**';
  const parts=formatParts(text,{automatic:false});
  assert.equal(parts.map(part=>part.text).join(''),text.replaceAll('**',''));
  assert.ok(parts.some(part=>part.technical&&/Càn 6.*Thiên Xung.*Hưu Môn.*Môn bức/s.test(part.text)));
  assert.deepEqual(parts.filter(part=>part.strong).map(part=>part.text),['Cách triển khai có lực thúc đẩy nhưng dễ bị quy trình bó lại.']);
  const root=new Node('div');renderProse(text,root,doc);
  const all=[];const visit=node=>{all.push(node);node.children.forEach(visit);};visit(root);
  const technical=all.find(node=>node.className==='ai-technical-prefix');
  assert.ok(technical);assert.match(technical.textContent,/Càn 6/);
  assert.ok(all.some(node=>node.tag==='strong'&&/Cách triển khai/.test(node.textContent)));
});
test('ordinary prose before a highlighted takeaway is not mislabeled as Kỳ Môn technical text',()=>{
  const parts=formatParts('Điểm đáng chú ý ở đây là tiến độ đang chậm. **Nên thu hẹp phạm vi trước khi tăng cam kết.**',{automatic:false});
  assert.equal(parts.some(part=>part.technical),false);
});

test('structured reading sections keep natural meaning visible and technical evidence separately toggleable',()=>{
  const section={
    meaning:'**Nên giữ phạm vi nhỏ trước khi tăng cam kết.**',
    technicalEvidence:['Cung Càn 6 có Khai Môn và Thiên Tâm; đây là căn cứ của trục hành động.'],
    claim_ids:['CLAIM_1']
  };
  assert.equal(sectionMeaning(section),section.meaning);
  assert.equal(sectionTechnicalText(section),section.technicalEvidence[0]);
  assert.equal(sectionText(section),section.technicalEvidence[0]+'\n\n'+section.meaning);
  const root=new Node('div');renderReadingSection(section,root,doc);
  assert.equal(root.children.length,2);
  assert.ok(root.children[0].children.some(child=>child.tag==='strong'));
  assert.equal(root.children[1].className,'ai-technical-block ai-technical-prefix');
  assert.match(root.children[1].textContent,/Cung Càn 6/);
});

test('structured meaning never uses legacy bold-prefix hiding and evidence never gains automatic emphasis',()=>{
  const root=new Node('div');
  renderReadingSection({meaning:'Không Vong ở đây chỉ là cách gọi. **Bạn vẫn nên giữ phương án dự phòng.**',technicalEvidence:['Cần kiểm tra điều kiện trước khi mở rộng cam kết.'],claim_ids:[]},root,doc);
  const visible=root.children[0],technical=root.children[1];
  assert.ok(visible.children.every(child=>child.className!=='ai-technical-prefix'));
  assert.ok(technical.children.every(p=>p.children.every(child=>child.tag!=='strong')));
});
