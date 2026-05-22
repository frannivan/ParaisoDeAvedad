import shutil
import os

src = "/Users/franivan/Documents/ProyectosWeb/HotelTriz"
dst = "/Users/franivan/Documents/ProyectosWeb/ParaisoDeAvedad"

# Ensure we don't copy into ourselves if we are inside src
# But dst is a sibling, so it's fine.

if os.path.exists(dst):
    os.system(f"rm -rf {dst}")

try:
    shutil.copytree(src, dst, dirs_exist_ok=True)
    print(f"Copied {src} to {dst}")
except Exception as e:
    print(f"Error: {e}")
