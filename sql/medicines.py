# -*- coding: UTF-8 -*-
import copy, pymysql
db = pymysql.connect(host='localhost', port=3306, user='wang', passwd='wang313', db='clinic')
cursor = db.cursor()

def main () :
    d = open("/home/wang/medicine.b5","rb")
    #d = open("C:\\Users\\quanbro\\OneDrive\\clinic1\\all1_1110623(1).txt","r")
    a = d.readline()
    data_len = [2, 10, 2, 10, 9, 7, 7, 120, 7, 52, 56, 12, 51, 86, 158, 20, 141, 1, 1, 128, 300, 56, 11, 51, 56, 11, 51, 56, 11, 51, 56, 11, 51, 56, 11, 51, 42, 8, 1]
    data_stop = summ(data_len, copy.deepcopy(data_len))
    num = 0
    total = []
    tem = ""
    t = 0
    #j = d.readline()
    total_len = 0
    #data = str(j)[2:len(j)-1]
    '''for i in range(len(data)) :
        tem += data[i]
        if i == data_stop[num] :
            total.append(tem[:len(tem)-1])
            tem = ""
            num += 1
    if len(total) <= 38 :
        sql = "insert into medicines(`New_mark`, `口服錠註記`, `單/複方註記`, `藥品代碼`, `藥價參考金額`, `藥價參考日期`, `藥價參考截止日期`, `藥品英文名稱`, `藥品規格量`, `藥品規格單位`, `成份名稱`, `成份含量`, `成份含量單位`, `藥品劑型`, `空白`, `藥商名稱`, `空白1`, `藥品分類`, `品質分類碼`, `藥品中文名稱`, `分類分組名稱`, `（複方一）成份名稱`, `（複方一）藥品成份含量`, `（複方一）藥品成份含量單位`, `（複方二）成份名稱`, `（複方二）藥品成份含量`, `（複方二）藥品成份含量單位`, `（複方三）成份名稱`, `（複方三）藥品成份含量`, `（複方三）藥品成份含量單位`, `（複方四）成份名稱`, `（複方四）藥品成份含量`, `（複方四）藥品成份含量單位`, `（複方五）成份名稱`, `（複方五）藥品成份含量`, `（複方五）藥品成份含量單位`, `製造廠名稱`, `ATC CODE`) values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
        cursor.execute(sql, (total[0], total[1], total[2], total[3], ckNum(total[4]), total[5], total[6], total[7], ckNum(total[8]), total[9], total[10], ckNum(total[11]), total[12], total[13], total[14], total[15], total[16], total[17], total[18], total[19], total[20], total[21], ckNum(total[22]), total[23], total[24], ckNum(total[25]), total[26], total[27], ckNum(total[28]), total[29], total[30], ckNum(total[31]), total[32], total[33], ckNum(total[34]), total[35], total[36], total[37]))
        db.commit()
    else :
        sql = "insert into medicines(`New_mark`, `口服錠註記`, `單/複方註記`, `藥品代碼`, `藥價參考金額`, `藥價參考日期`, `藥價參考截止日期`, `藥品英文名稱`, `藥品規格量`, `藥品規格單位`, `成份名稱`, `成份含量`, `成份含量單位`, `藥品劑型`, `空白`, `藥商名稱`, `空白1`, `藥品分類`, `品質分類碼`, `藥品中文名稱`, `分類分組名稱`, `（複方一）成份名稱`, `（複方一）藥品成份含量`, `（複方一）藥品成份含量單位`, `（複方二）成份名稱`, `（複方二）藥品成份含量`, `（複方二）藥品成份含量單位`, `（複方三）成份名稱`, `（複方三）藥品成份含量`, `（複方三）藥品成份含量單位`, `（複方四）成份名稱`, `（複方四）藥品成份含量`, `（複方四）藥品成份含量單位`, `（複方五）成份名稱`, `（複方五）藥品成份含量`, `（複方五）藥品成份含量單位`, `製造廠名稱`, `ATC CODE`, `未生產或未輸入達五年`) values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
        #cursor.execute(sql, (total[0], total[1], total[2], total[3], total[4], total[5], total[6], total[7], total[8], total[9], total[10], total[11], total[12], total[13], total[14], total[15], total[16], total[17], total[18], total[19], total[20], total[21], total[22], total[23], total[24], total[25], total[26], total[27], total[28], total[29], total[30], total[31], total[32], total[33], total[34], total[35], total[36], total[37], total[38]))
        #db.commit()
    for i in range(len(total)) :
        print(i+1 ,end ='')
        print("項", end ='')
        print(" 長度", end='')
        total_len += len(total[i])
        print(len(total[i]), end ='')
        print(total[i])
    print(total_len) '''
    old_total = []
    for j in d.readlines() :
        data = str(j)[2:len(j)-1]
        total = []
        num = 0
        for i in range(len(data)) :
            tem += data[i]
            if i == data_stop[num] :
                total.append(ckSpace(tem[:len(tem)-1]))
                tem = ""
                num += 1
        if len(total) <= 38 :
            sql = "insert into medicines(`new_mark`, `oral_tablet`, `single_two`, `code`, `price`, `price_date`, `price_fin_date`, `medi_eng`, `medi_amount`, `medi_unit`, `ingre`, `ingre_amount`, `ingre_unit`, `dose_form`, `empty`, `medi_producer`, `empty1`, `medi_sort`, `quality_code`, `medi_mand`, `sort_group`, `fir_ingre`, `fir_medi_amount`, `fir_medi_unit`, `sec_ingre`, `sec_medi_amount`, `sec_medi_unit`, `thi_ingre`, `thi_medi_amount`, `thi_medi_unit`, `four_ingre`, `four_medi_amount`, `four_medi_unit`, `fift_ingre`, `fift_medi_amount`, `fift_medi_unit`, `producer`, `atc_code`) values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            cursor.execute(sql, (total[0], total[1], total[2], total[3], ckNum(total[4]), total[5], total[6], total[7], ckNum(total[8]), total[9], total[10], ckNum(total[11]), total[12], total[13], total[14], total[15], total[16], total[17], total[18], total[19], total[20], total[21], ckNum(total[22]), total[23], total[24], ckNum(total[25]), total[26], total[27], ckNum(total[28]), total[29], total[30], ckNum(total[31]), total[32], total[33], ckNum(total[34]), total[35], total[36], total[37]))
            db.commit()
        else :
            sql = "insert into medicines(`new_mark`, `oral_tablet`, `single_two`, `code`, `price`, `price_date`, `price_fin_date`, `medi_eng`, `medi_amount`, `medi_unit`, `ingre`, `ingre_amount`, `ingre_unit`, `dose_form`, `empty`, `medi_producer`, `empty1`, `medi_sort`, `quality_code`, `medi_mand`, `sort_group`, `fir_ingre`, `fir_medi_amount`, `fir_medi_unit`, `sec_ingre`, `sec_medi_amount`, `sec_medi_unit`, `thi_ingre`, `thi_medi_amount`, `thi_medi_unit`, `four_ingre`, `four_medi_amount`, `four_medi_unit`, `fift_ingre`, `fift_medi_amount`, `fift_medi_unit`, `producer`, `atc_code`, `no_input`) values(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            cursor.execute(sql, (total[0], total[1], total[2], total[3], ckNum(total[4]), total[5], total[6], total[7], ckNum(total[8]), total[9], total[10], ckNum(total[11]), total[12], total[13], total[14], total[15], total[16], total[17], total[18], total[19], total[20], total[21], ckNum(total[22]), total[23], total[24], ckNum(total[25]), total[26], total[27], ckNum(total[28]), total[29], total[30], ckNum(total[31]), total[32], total[33], ckNum(total[34]), total[35], total[36], total[37], total[38]))
            db.commit()
        old_total.append(total)
    print(len(old_total))
    '''total_len = 0
    for i in range(len(total)) :
        print(i+1 ,end ='')
        print("項", end ='')
        print(" 長度", end='')
        total_len += len(total[i])
        print(len(total[i][:len(total[i])-1]), end ='')
        print(total[i][:len(total[i])-1])
    print(total_len)'''

def ckSpace(data) :
    n_data = ""
    for i in range(len(data)) :
        if i == len(data)-1 :
            if data[i] == " " :
                break
            else :
                n_data += data[i]
                break
        if i == 0 and data[i] == " " : # 第一個為空白
            continue
        else :
            if data[i] == " " and (data[i-1] == " " or data[i+1] == " ") :
                continue
            else :
                n_data += data[i] 
    return n_data
            

def ckNum(num) : # 檢查是否為小數
    try :
        return float(num)
    except ValueError :
        return None

def summ(data, copy_data) : # 計算迄末位置
    for i in range(len(data)) :
        for j in range(i) :
            data[i] += copy_data[j]
        if i != 0 :
            data[i] += 1
            copy_data[i] += 1
    return data

main()
