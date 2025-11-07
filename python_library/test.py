from datetime import datetime

class Book :
    def __init__(self,title,author,isbn,stock):
        self.title = title
        self.author = author 
        self.isbn = isbn 
        self.stock = stock 

    # def __repr__(self):
    #     return f'제목 : {self.title}\n저자 : {self.author}\nISBN : {self.isbn}\n재고 : {self.stock}\n'

class LentBook :
    def __init__(self, id, username, book, time):
        self.id = id
        self.username = username
        self.book = book
        self.time = time

    def __repr__(self):
        return f'책 제목 : {self.book}\n빌린사람 : {self.username}\n대여시간 : {self.time}'
    
class Member :
    def __init__(self,username,pwd,role):

        if(role not in ["user", "admin"]) :
            raise ValueError

        self.username = username
        self.pwd = pwd 
        self.role = role 
    
    # def __repr__(self):
    #     return f'{self.role} {self.username}'

class Library : 
    ##도서와 유저 정보는 dictionary로 관리 
    def __init__(self):
        books = {} 
        members = {}
        lent_books = {}
        ## 처음 Library 객체 생성 시 books 정리 
        with open("./data/book_output.txt", encoding="utf-8") as f:
            while True:
                line = f.readline()
                if not line:
                    break

                book_info = line.strip().split("$")        
                books[book_info[0]] = Book(book_info[0],book_info[1],book_info[2],book_info[3])
            f.close()

        ## 처음 Library 객체 생성 시 members 정리 
        with open("./data/members.txt",encoding="utf-8") as f :
            while True:
                line=f.readline()
                if not line:
                    break 
                user_info = line.strip().split("$")     
                members[user_info[0]] = Member(user_info[0], user_info[1], user_info[2])  
            f.close()

        ## 처음 Library 객체 생성 시 lent_books 정리 
        with open("./data/lent_books.txt",encoding="utf-8") as f :
            while True:
                line=f.readline()
                if not line:
                    break 
                lent_book_info = line.strip().split("$")     
                #0 id
                #1 책
                #2 빌린 유저
                #3 시간 
                lent_books[lent_book_info[0]] = LentBook(lent_book_info[0],lent_book_info[1],lent_book_info[2],lent_book_info[3])
            f.close()


        self.books = books 
        self.members = members 
        self.lent_books = lent_books
    
    def get_members(self) :
        return self.members
    
    def get_member(self,username) :
        return self.members[username]
    
    def post_member(self, username, pwd, role) :
        try :
            member = Member(username,pwd, role) 
        except ValueError :
            print("역할을 제대로 지정해주세요")
            return 

        # 중복 확인
        if (username in self.members):
            print("이미 있는 아이디입니다")
            return
        else :
            self.members[username] = member 
        print(f'회원가입에 성공하셨습니다.')
    
    def get_books(self) :
        for book in self.books.values() :
            print(f'{book.title} {book.author} {book.isbn}\n')
            
    
    def get_book(self, book_name) :
        if(book_name not in self.books.keys()) :
            print("재고가 없습니다")
        return self.books[book_name]

    def get_statics(self) :
        pass 

    def get_lent_books(self) :
        return self.lent_books 
    
    def lent_book(self,book_name, username) :
        ## 만약 없는 책이면 에러 
        if(book_name not in self.books.keys()) :
            print("도서관에 없는 책입니다")
            return 
        
        book = self.books[book_name] 
        ## 만약 도서에 재고가 없다면 에러 
        if(int(book.stock) < 1) :
            print("도서관에 재고가 없습니다")
            return
        
        book.stock = int(book.stock) - 1 

        self.lent_books[book_name]=LentBook(len(self.lent_books)+1,username,book_name,datetime.now())


    def return_book(self,book_name) :
        pass 

    def save_data(self) :
        with open("./data/book_output.txt", "w", encoding="utf-8") as f:
            for book in self.books.values() :
                f.write(f'{book.title}${book.author}${book.isbn}${book.stock}\n')
            f.close()

        ## 처음 Library 객체 생성 시 members 정리 
        with open("./data/members.txt","w", encoding="utf-8") as f :
            for member in self.members.values() :
                f.write(f'{member.username}${member.pwd}${member.role}\n')
            f.close()

        with open("./data/lent_books.txt","w",encoding="utf-8") as f :
            count = 0
            for lent_book in self.lent_books.values() :
                f.write(f'{count}${lent_book.username}${lent_book.book}${lent_book.time}\n')
                count +=1
            f.close()

nowMember = None 

while(True) :
    library = Library() 
    
    command = int(input("0. 회원 가입\n1. 도서 목록 보기\n2. 대여하기\n3. 반납하기\n4. 대여 기록\n5. 통계 보기\n6. 종료\n"))
    if(command == 1) :
        library.post_member()
    elif(command == 0) :
        library.get_books()
    elif(command == 2) :
        library.lent_book()
    elif(command == 3) :
        library.return_book() 
    elif(command == 4) :
        library.get_lent_books()
    elif(command == 5) :
        library.get_statics()
    elif(command == 6) :
        break
    


