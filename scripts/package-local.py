from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
target=root/'dist/downloads/ky-mon-ai.zip'
target.parent.mkdir(parents=True,exist_ok=True)
files=list((root/'local').glob('*.mjs'))+list((root/'dist').glob('*.mjs'))+list((root/'dist').glob('*.html'))+list((root/'dist').glob('*.css'))+list((root/'dist/vendor').iterdir())
files += list((root/'dist/assets').iterdir())
files += [root/n for n in ['START-WINDOWS.cmd','START-MAC.command','HUONG-DAN-LOCAL.md']]
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
    for file in sorted(files):
        z.write(file,'ky-mon-ai/'+file.relative_to(root).as_posix())
print(target)
