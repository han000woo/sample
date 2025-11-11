from tkinter import * 
win = Tk() 
def click() :
    print(password.get())

password =Entry(win, show="*")
password.pack(fill=X)


win.geometry("300x300")
btn = Button(win, text='click', bg='red',fg='white', command=click)
btn.pack()
win.mainloop()