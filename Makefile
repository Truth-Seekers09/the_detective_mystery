CXX      = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -Iinclude
SRCS     = $(wildcard src/*.cpp)
LIBSRCS  = $(filter-out src/main.cpp,$(SRCS))

hiddentruth: $(SRCS) $(wildcard include/*.h)
	$(CXX) $(CXXFLAGS) $(SRCS) -o hiddentruth

test: tests/test_structures.cpp $(LIBSRCS) $(wildcard include/*.h)
	$(CXX) $(CXXFLAGS) tests/test_structures.cpp $(LIBSRCS) -o run_tests
	./run_tests

clean:
	rm -f hiddentruth run_tests hiddentruth_web

playtest: hiddentruth
	sh tests/playtest.sh

# Browser version (recommended): a small C++ web server + the web/ front end. Needs only g++.
#   make web        then run:  ./hiddentruth_web
web: server/web_main.cpp $(LIBSRCS) $(wildcard include/*.h) third_party/httplib.h
	$(CXX) -std=c++17 -O2 -Iinclude -Ithird_party server/web_main.cpp $(LIBSRCS) -o hiddentruth_web -pthread
.PHONY: web test clean playtest
