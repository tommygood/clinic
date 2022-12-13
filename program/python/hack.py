import requests


url = 'http://163.22.17.225:8080/CPU/Dataset?dataset_num=1&dataset_num=2'
myobj = {'dataset_num': '5', 'dataset_num' : '1'}

cookies = {'connect.sid': 's%3AeEg-o8eXABhZiRSdeqfpRD4mHaiUa4HT.mMu2fRuHmSodMCwLUMW5mbEHgT20nq74GCX%2B0AalfTc', 'connect.si' : 's%3A5WNj-KGo1fPME4KnzJUbdGJtoXBCtoCj.Q3EOZuHuLWTJhaCHEyINzVzQTXdFmUQuuYS4m1GqxXM'}
x = requests.post(url, cookies = cookies)
print(1)