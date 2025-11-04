# **문제 설명:**

# 3명의 후보자에 대한 투표를 진행합니다.

# - 3명의 후보자 이름을 입력받고, 각 후보의 득표수를 0으로 초기화하세요.
# - 10명의 투표자가 투표를 진행합니다. 후보 이름을 입력받아 득표수를 증가시키세요.
# - 등록되지 않은 이름을 입력하면 무효표로 카운트하세요.
# - 투표 종료 후 각 후보의 득표수를 출력하세요.
# - 가장 많은 표를 받은 후보를 찾아 당선자로 발표하세요.

# Hint: 후보자에 대한 득표수를 딕셔너리로 만드세요! {후보자:득표수}

# **입력 예시:**


# 김철수
# 이영희
# 박민수

# 김철수
# 이영희
# 김철수
# 박민수
# 이영희
# 김철수
# 이영희
# 최지은
# 김철수
# 이영희


# **출력 예시:**

# === 투표 결과 ===
# 총 투표자: 10명
# 유효 투표: 9표
# 무효 투표: 1표

# === 후보별 득표 현황 ===
# 김철수: 4표
# 이영희: 4표
# 박민수: 1표

# === 당선자 발표 ===
# 김철수 후보가 당선되었습니다! (득표수: 4표)

candidate_A = input("후보자 등록 : ")
candidate_B = input("후보자 등록 : ")
candidate_C = input("후보자 등록 : ")
error_count = 0
while(True) :
    
    cand_dict = {
        candidate_A : 0,
        candidate_B : 0,
        candidate_C : 0,
    }

    for i in range(10) :
        vote = input(f'고르세요 : {candidate_A} , {candidate_B} , {candidate_C} {10 - i} : ')
        if(vote not in cand_dict.keys()) :
            error_count +=1
        else : 
            cand_dict[vote] += 1

    not_valid_vote = error_count
    valid_vote = 10 - not_valid_vote
    

    max = 0
    max_vote_lst = []

    print("=== 투표 결과 ===")
    print("총 투표자: 10명")
    print(f'유효 투표: {valid_vote}표')
    print(f'무효 투표: {not_valid_vote}표')

    print("=== 후보별 득표 현황 ===")
    for k,v in cand_dict.items() :
        print(f'{k}: {v}표')
        if(v > max) :
            max_vote_lst.clear()
            max_vote_lst.append(k) 
            max = v 
        elif(v==max) :
            max_vote_lst.append(k) 

    ## 저는 공동 우승은 재투표를 해야 한다고 생각합니다. 
    if(len(max_vote_lst)==1) :
        print("=== 당선자 발표 ===")
        print(f'{max_vote_lst[0]} 후보가 당선되었습니다! (득표수: {max}표)')
        break

    print("공동 1등이 나왔으니 재투표 합니다")


    
    


# 김철수: 4표
# 이영희: 4표
# 박민수: 1표

# === 당선자 발표 ===
# 김철수 후보가 당선되었습니다! (득표수: 4표)

