from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()

## password를 해싱한다 
def get_password_hash(password) :
    return password_hash.hash(password)

## password 해석
def verify_password(plain_password, hashed_password) :
    return password_hash.verify(plain_password, hashed_password)