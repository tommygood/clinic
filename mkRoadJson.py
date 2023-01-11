import json
from openpyxl import load_workbook
import csv
# 把路名寫入 road.txt
# python mkRoadJson.py > road.txt
# 記得要去把 road.txt 轉成 utf-8
# 要把 road.txt 的換行(第二行的空白)刪掉

def main() :
    # 開啟路名 CSV 檔案
    with open('road.csv', "r", newline='', encoding="utf8") as csvfile:
        # 讀取 CSV 檔案內容
        rows = csv.reader(csvfile)
        total_county = []
        total_area = []
        total_road = []
        all_road = {}
        # 每一列
        row_index = 0
        for row in rows:
            row_index += 1
            if row_index < 3 :
                continue
            if row[0] not in total_county :
                total_county.append(row[0])
            if row[1] not in total_area :
                total_area.append(row[1])
            full_road_name = row[1] + row[2]
            if '邨' in full_road_name : 
                full_road_name = reName(full_road_name, full_road_name.index('邨'), '村')
            try :
                full_road_name.encode(encoding='cp950')
            except : # 路名中有無法解讀的特殊字，就丟棄這個路名
                continue
            if full_road_name not in total_road :
                total_road.append(full_road_name)
            if row[1] not in all_road :
                all_road[row[1]] = [full_road_name]
            else :
                all_road[row[1]].append(full_road_name)
        print(all_road)

def reName(full_road_name, index, change) :
    new_name = ''
    for i in range(len(full_road_name)) :
        if i == index :
            new_name += change
        else :
            new_name += full_road_name[i]
    return new_name

main()

