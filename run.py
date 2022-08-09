from flask import Flask, render_template, request, jsonify, json, redirect, url_for

run = Flask(__name__)

@run.route("/")
def home():
    return render_template('home.html')

@run.route("/User_Guide")
def userGuide():
    return render_template('user_guide.html')

@run.route("/control_panel")
def controlPanel():
    return render_template('control_panel.html')

# @app.route("/select", methods = ["POST"])
# def UavSelect():
#     id = request.form['UAV_ID']
#     return redirect(url_for('UavControl', id=id))

# @app.route('/Control_Panel/ID/<int:id>')
# def UavControl(id):
#     return render_template('control_panel.html', id = id)


if __name__ == '__main__':
    run.run()