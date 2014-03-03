gh-pages:
	rm -rf build
	git clone git@github.com:barbuza/miniwyg-es5 build
	cd build && git fetch
	cd build &&  git checkout gh-pages
	gulp build
	cd build && git commit -m 'sync' -a
	cd build && git push origin gh-pages
	rm -rf build
