gh-pages:
	rm -rf build
	git clone git@github.com:barbuza/miniwyg-es5 build
	cd build && git fetch
	cd build &&  git checkout gh-pages
	gulp build
	sed -i '' 's/miniwyg-pure-debug.js/miniwyg-pure.js/g' build/index.html
	cd build && git commit -m 'sync' -a
	cd build && git push origin gh-pages
	rm -rf build
