#!/usr/bin/python2
import json, psycopg2
from os import environ
from json import dumps

conn = None
cur = None

def connect():
    global conn, cur
    if(conn == None):
        conn = psycopg2.connect("dbname=imageboard user=board")
        cur = conn.cursor()
    return cur

def postList(boardId, postId):
    cur = connect()
    postList = []
    sel = "SELECT posts.id, posts.date, posts.title, posts.body FROM main.posts"
    try:
        postId = int(postId)
        cur.execute(sel + " where posts.id = %s;", (postId,))
        for x in cur:
            postObj = {"id": x[0], "date": x[1], "title": x[2], "body": x[3]}
            postList.append(postObj)
        cur.execute(sel + " where posts.parent = %s;", (postId,))
    except (ValueError, TypeError):
        try:
            boardId = int(boardId)
            cur.execute(sel + " where posts.board = %s and posts.parent = 0;",
			(boardId,))
        except (ValueError, TypeError):
            cur = ()

    for x in cur:
        postObj = {"id": x[0], "date": x[1], "title": x[2], "body": x[3]}
        postList.append(postObj)
    print dumps(postList)

def boardList():
    cur = connect()
    cur.execute("SELECT boards.id, boards.name FROM main.boards;")
    boards = []
    for x in cur:
        board = {"id": x[0], "name": x[1]}
        boards.append(board)
    print dumps(boards)

def main():
    print "Content-type: text/plain\r\n"
    
    params = {}
    try:
	for x in environ["QUERY_STRING"].split("&"):
        	params.update({x.split("=")[0]: x.split("=")[1]})
    except IndexError:
	pass	
    except KeyError:
	print "{}"
	return

    if params.get("show") == "boardlist":
        boardList()
    elif params.get("show") == "posts":
        postList(params.get("board"), params.get("post"))
    else:
        print params

if(__name__ == "__main__"):
	main()