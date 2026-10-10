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
	rm -f hiddentruth run_tests
