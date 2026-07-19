#!/usr/bin/env python3
"""Rebuild the single-file offline version from the split source files.
Usage: python3 build-standalone.py    ->  forge-lesson-standalone.html"""
import io,re,os
d=os.path.dirname(os.path.abspath(__file__))
r=lambda f: io.open(os.path.join(d,f),encoding="utf-8").read()
h=r("index.html")
h=re.sub(r'<link rel="stylesheet" href="forge\.css[^"]*">',lambda m:"<style>\n"+r("forge.css")+"\n</style>",h)
h=re.sub(r'<script src="forge-data\.js[^"]*"></script>\s*<script src="forge-app\.js[^"]*"></script>',
         lambda m:"<script>\n"+r("forge-data.js")+"\n"+r("forge-app.js")+"\n</script>",h)
h=re.sub(r'<!-- Bump \?v=[^>]*-->\n?','',h)
io.open(os.path.join(d,"forge-lesson-standalone.html"),"w",encoding="utf-8").write(h)
print("wrote forge-lesson-standalone.html (%d KB)"%(len(h)//1024))
