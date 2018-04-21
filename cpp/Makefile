CC = g++
CFLAGS=-std=c++11 -Werror -Wall -Wextra -lm -O3 -I ai

all: breakthrough

%.o: %.cpp 
	$(CC) -c -o $@ $< $(CFLAGS)
	
breakthrough: main.o bitboard.o
	$(CC) -o bin/breakthrough main.o bitboard.o $(CFLAGS)

wins: gen-wins.o bitboard.o
	$(CC) -o bin/gen-wins gen-wins.o bitboard.o $(CFLAGS)
	
clean:
	rm *.o
	#rm bin/breakthrough
	rm bin/gen-wins
