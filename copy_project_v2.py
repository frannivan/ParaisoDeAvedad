import shutil
import os

src = "/Users/franivan/Documents/ProyectosWeb/HotelTriz"
dst = "/Users/franivan/Documents/ProyectosWeb/ParaisoDeAvedad"

def force_remove(path):
    if os.path.isfile(path) or os.path.islink(path):
        os.remove(path)
    elif os.path.isdir(path):
        shutil.rmtree(path)

if os.path.exists(dst):
    try:
        force_remove(dst)
        print(f"Removed {dst}")
    except Exception as e:
        print(f"Failed to remove {dst}: {e}")

try:
    # Use a custom copy function to avoid some metadata issues
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns('.git', 'node_modules', '.history', '.cache', '.npm_cache'))
    print(f"Successfully copied {src} to {dst}")
except Exception as e:
    print(f"Failed to copy: {e}")
