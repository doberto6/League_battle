from pathlib import Path
import re

src = Path('Hexclash.jsx').read_text(encoding='utf-8')
matches = re.findall(r'const\s+(YASUO|GAREN|DARIUS|ASHE|JINX|LUX|SORAKA|MALPHITE|KATARINA|THRESH)_SPRITE\s*=\s*"([^"]+)";', src)
order = ['YASUO', 'GAREN', 'DARIUS', 'ASHE', 'JINX', 'LUX', 'SORAKA', 'MALPHITE', 'KATARINA', 'THRESH']
content = []
for name in order:
    found = next((m[1] for m in matches if m[0] == name), None)
    if found is None:
        raise SystemExit(f'missing {name}')
    content.append(f'export const {name}_SPRITE = "{found}";')
Path('src/data/customSprites.js').write_text('\n'.join(content) + '\n', encoding='utf-8')
print('wrote src/data/customSprites.js')
