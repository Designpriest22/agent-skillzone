"""Build every print file: python3 build.py [filter]  ->  build/pdf/..."""
import os
import subprocess
import sys

import lib
import textures

MODULES = ['p_signage', 'p_menus', 'p_access', 'p_activations', 'p_decor_crew', 'p_vip']


def main():
    flt = sys.argv[1] if len(sys.argv) > 1 else ''
    textures.build_all(lib.TEX)
    for m in MODULES:
        __import__(m).build()
    nums = [x for x in flt.split(',') if x]
    docs = [d for d in lib.REGISTRY if not nums or d.num in nums]
    man = os.path.join(lib.BUILD, 'manifest.json')
    lib.write_manifest(docs, man)
    subprocess.run(['node', os.path.join(lib.ROOT, 'render.js'), man], check=True)
    import finalize
    finalize.post(docs)


if __name__ == '__main__':
    main()
