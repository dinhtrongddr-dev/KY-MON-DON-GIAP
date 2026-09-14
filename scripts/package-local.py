from pathlib import Path
import zipfile
import sys
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parents[1]
target=root/'dist/downloads/ky-mon-ai.zip'
target.parent.mkdir(parents=True,exist_ok=True)
files=list((root/'local').glob('*.mjs'))+list((root/'dist').glob('*.mjs'))+list((root/'dist').glob('*.html'))+list((root/'dist').glob('*.css'))+list((root/'dist/vendor').iterdir())
files += list((root/'dist/assets').iterdir())
files += list((root/'dist/qimen').rglob('*.mjs'))
files += list((root/'dist').glob('*.svg'))+list((root/'dist').glob('*.png'))
files += list((root/'tests').glob('*.mjs'))
files += [root/n for n in ['START-WINDOWS.cmd','START-MAC.command','HUONG-DAN-LOCAL.md','AI-EVAL.md','QIMEN-ARCHITECTURE.md']]
files += [root/'scripts/verify-assets.mjs',root/'scripts/package-local.py']
# The customized Windows launcher needs its executable and tunnel alongside it.
files += [root/n for n in ['KyMonTray.exe','KyMonTray.ico','KyMonTray-white.ico','KyMonTray.png','LOGIN-WINDOWS.cmd','local/KyMonTray.cs'] if (root/n).is_file()]
files += [root/'tools'/n for n in ['cloudflared.exe','LICENSE.cloudflared'] if (root/'tools'/n).is_file()]
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
    for file in sorted(files):
        z.write(file,'ky-mon-ai/'+file.relative_to(root).as_posix())
print(target)
