import pathlib
import shutil
import subprocess
import sys
import tempfile
import unittest

REPO = pathlib.Path(__file__).resolve().parents[1]


class PackageRegressionTests(unittest.TestCase):
    def test_missing_windows_dependency_never_replaces_an_existing_package(self):
        with tempfile.TemporaryDirectory(prefix='kymon-package-') as directory:
            root = pathlib.Path(directory)
            for name in ['local', 'dist/vendor', 'dist/assets', 'dist/qimen',
                         'dist/downloads', 'tests', 'scripts', 'tools']:
                (root / name).mkdir(parents=True, exist_ok=True)
            for name in ['START-WINDOWS.cmd', 'START-MAC.command', 'HUONG-DAN-LOCAL.md',
                         'AI-EVAL.md', 'QIMEN-ARCHITECTURE.md', 'scripts/verify-assets.mjs']:
                (root / name).write_text('fixture', encoding='utf-8')
            shutil.copyfile(REPO / 'scripts/package-local.py', root / 'scripts/package-local.py')
            target = root / 'dist/downloads/ky-mon-ai.zip'
            target.write_bytes(b'existing-working-package')
            result = subprocess.run([sys.executable, str(root / 'scripts/package-local.py')],
                                    capture_output=True, text=True, encoding='utf-8')
            self.assertNotEqual(result.returncode, 0, 'An incomplete Windows package must fail')
            self.assertIn('cloudflared.exe', result.stderr)
            self.assertEqual(target.read_bytes(), b'existing-working-package')


if __name__ == '__main__':
    unittest.main()
