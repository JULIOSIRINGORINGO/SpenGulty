import os
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, render_template, redirect, url_for, request, flash, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, extract
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename # 1. Import Wajib buat Upload

app = Flask(__name__)
app.config['SECRET_KEY'] = 'spendguilty_secret_key'

# --- KONFIGURASI DATABASE & UPLOAD ---
basedir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(basedir, 'instance')
if not os.path.exists(instance_path):
    os.makedirs(instance_path)

# 2. Update Database ke V4 (Biar Support Kolom Foto)
db_path = os.path.join(instance_path, 'spendguilty_v4.db').replace('\\', '/')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 3. Konfigurasi Folder Upload
UPLOAD_FOLDER = os.path.join(basedir, 'static/uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# Buat folder otomatis kalau belum ada
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db = SQLAlchemy(app)

# --- MODEL DATABASE ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nama = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    pekerjaan = db.Column(db.String(100))
    tgl_lahir = db.Column(db.String(20))
    password = db.Column(db.String(200), nullable=False)
    saldo_awal = db.Column(db.Integer, default=0)
    foto = db.Column(db.String(200)) # 4. Kolom Baru buat Foto

class Budget(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Integer, default=0)

class Kategori(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nama = db.Column(db.String(100), nullable=False)
    tipe = db.Column(db.String(20), nullable=False)
    icon = db.Column(db.String(50), default='fas fa-wallet')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    transaksi_rel = db.relationship('Transaksi', backref='kategori', lazy=True)

class Transaksi(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nominal = db.Column(db.Float, nullable=False)
    keterangan = db.Column(db.String(200))
    tanggal = db.Column(db.Date, nullable=False)
    tipe = db.Column(db.String(20), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    kategori_id = db.Column(db.Integer, db.ForeignKey('kategori.id'))

# --- DECORATOR ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# --- ROUTES ---

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        nama = request.form.get('nama')
        email = request.form.get('email')
        pekerjaan = request.form.get('pekerjaan')
        tgl_lahir = request.form.get('tgl_lahir')
        password = request.form.get('password')
        konfirmasi = request.form.get('konfirmasi') # Ambil input konfirmasi

        # --- VALIDASI 1: Cek Password Kembar ---
        if password != konfirmasi:
            flash('Password dan Konfirmasi tidak cocok!', 'danger')
            return redirect(url_for('register'))
        
        # --- VALIDASI 2: Cek Email Kembar ---
        cek_email = User.query.filter_by(email=email).first()
        if cek_email:
            flash('Email ini sudah terdaftar!', 'danger')
            return redirect(url_for('register'))

        # Kalau aman, baru simpan ke Database
        hash_pw = generate_password_hash(password, method='pbkdf2:sha256')
        new_user = User(
            nama=nama,
            email=email,
            pekerjaan=pekerjaan,
            tgl_lahir=tgl_lahir,
            password=hash_pw
        )
        db.session.add(new_user)
        db.session.commit()
        
        # Buat Kategori Default
        defaults = [
            {'nama': 'MAKAN', 'icon': 'fas fa-utensils'},
            {'nama': 'TRANSPORTASI', 'icon': 'fas fa-bus'},
            {'nama': 'BELANJA', 'icon': 'fas fa-shopping-bag'},
            {'nama': 'HIBURAN', 'icon': 'fas fa-gamepad'},
            {'nama': 'GAJI', 'icon': 'fas fa-wallet', 'tipe': 'Pemasukan'}
        ]
        for d in defaults:
            tipe_kat = d.get('tipe', 'Pengeluaran')
            db.session.add(Kategori(nama=d['nama'], tipe=tipe_kat, icon=d['icon'], user_id=new_user.id))
        db.session.commit()

        flash('Akun berhasil dibuat! Silakan Login.', 'success') # Kasih notif sukses
        return redirect(url_for('login'))

    return render_template('auth/register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = User.query.filter_by(email=request.form.get('email')).first()
        if user and check_password_hash(user.password, request.form.get('password')):
            session['user_id'] = user.id
            session['user_nama'] = user.nama
            return redirect(url_for('dashboard'))
        flash('Email atau Password Salah!', 'danger')
    return render_template('auth/login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    user = User.query.get(session['user_id'])
    budget_data = Budget.query.filter_by(user_id=user.id).first()
    saldo_awal = budget_data.amount if budget_data else 0

    total_pengeluaran = db.session.query(func.sum(Transaksi.nominal)).filter_by(user_id=user.id, tipe='Pengeluaran').scalar() or 0
    total_pemasukan = db.session.query(func.sum(Transaksi.nominal)).filter_by(user_id=user.id, tipe='Pemasukan').scalar() or 0
    sisa_saldo = (saldo_awal + total_pemasukan) - total_pengeluaran
    
    return render_template('main/dashboard.html', page='dashboard', user=user, total=total_pengeluaran, sisa=sisa_saldo)

@app.route('/home')
@login_required
def home():
    user_id = session['user_id']
    q = request.args.get('q', '')
    cat_id = request.args.get('cat_id')
    month_val = request.args.get('month')
    sort_val = request.args.get('sort')

    trans_query = Transaksi.query.filter_by(user_id=user_id)

    if cat_id:
        trans_query = trans_query.filter(Transaksi.kategori_id == cat_id)
    if month_val and '-' in month_val:
        y, m = month_val.split('-')
        trans_query = trans_query.filter(extract('year', Transaksi.tanggal) == int(y), 
                                         extract('month', Transaksi.tanggal) == int(m))
    if q:
        trans_query = trans_query.join(Kategori).filter(
            (Transaksi.keterangan.ilike(f"%{q}%")) | (Kategori.nama.ilike(f"%{q}%"))
        )

    if sort_val == 'terbanyak':
        trans_query = trans_query.order_by(Transaksi.nominal.desc())
    elif sort_val == 'terkecil':
        trans_query = trans_query.order_by(Transaksi.nominal.asc())
    else:
        trans_query = trans_query.order_by(Transaksi.tanggal.desc())

    data = trans_query.all()
    list_kategori = Kategori.query.filter_by(user_id=user_id).all()
    
    return render_template('main/home.html', data=data, categories=list_kategori, search_query=q)

@app.route('/set_budget', methods=['GET', 'POST'])
@login_required
def set_budget():
    budget = Budget.query.filter_by(user_id=session['user_id']).first()
    if request.method == 'POST':
        raw_nominal = request.form.get('nominal', '0')
        clean_nominal = ''.join(filter(str.isdigit, raw_nominal)) 
        if not clean_nominal: clean_nominal = 0
        nominal = int(clean_nominal)

        if budget:
            budget.amount = nominal
        else:
            new_budget = Budget(user_id=session['user_id'], amount=nominal)
            db.session.add(new_budget)
        db.session.commit()
        return redirect(url_for('dashboard'))
    return render_template('main/set_budget.html', budget=budget)

@app.route('/add_expense', methods=['GET', 'POST'])
@login_required
def add_expense():
    list_kategori = Kategori.query.filter_by(user_id=session['user_id']).all()
    if not list_kategori:
        defaults = [
            {'nama': 'MAKAN', 'icon': 'fas fa-utensils'},
            {'nama': 'TRANSPORTASI', 'icon': 'fas fa-bus'},
            {'nama': 'BELANJA', 'icon': 'fas fa-shopping-bag'},
            {'nama': 'HIBURAN', 'icon': 'fas fa-gamepad'},
            {'nama': 'GAJI', 'icon': 'fas fa-wallet', 'tipe': 'Pemasukan'}
        ]
        for d in defaults:
            tipe_kat = d.get('tipe', 'Pengeluaran')
            db.session.add(Kategori(nama=d['nama'], tipe=tipe_kat, icon=d['icon'], user_id=session['user_id']))
        db.session.commit()
        list_kategori = Kategori.query.filter_by(user_id=session['user_id']).all()

    edit_id = request.args.get('edit_id')
    t_edit = None
    if edit_id:
        t_edit = Transaksi.query.get(edit_id)

    if request.method == 'POST':
        nominal_raw = request.form.get('jumlah').replace('.', '').replace(',', '')
        tanggal_input = datetime.strptime(request.form.get('tanggal'), '%Y-%m-%d')
        kat_id = request.form.get('kategori_id')
        kat = Kategori.query.get(kat_id)
        tipe = kat.tipe if kat else 'Pengeluaran'
        
        target_id = request.form.get('target_id')
        if target_id:
            t = Transaksi.query.get(target_id)
            t.nominal = int(nominal_raw)
            t.keterangan = request.form.get('keterangan')
            t.tanggal = tanggal_input
            t.kategori_id = kat_id
            t.tipe = tipe
        else:
            new_t = Transaksi(nominal=int(nominal_raw), keterangan=request.form.get('keterangan'),
                              tanggal=tanggal_input, kategori_id=kat_id, tipe=tipe, user_id=session['user_id'])
            db.session.add(new_t)
        db.session.commit()
        return redirect(url_for('dashboard'))

    current_date = t_edit.tanggal.strftime('%Y-%m-%d') if t_edit else datetime.now().strftime('%Y-%m-%d')
    return render_template('main/add.html', categories=list_kategori, current_date=current_date, t=t_edit)

@app.route('/delete_expense/<int:id>')
@login_required
def delete_expense(id):
    t = Transaksi.query.get(id)
    if t and t.user_id == session['user_id']:
        db.session.delete(t)
        db.session.commit()
    return redirect(url_for('dashboard'))

@app.route('/add_category', methods=['GET', 'POST'])
@login_required
def add_category():
    if request.method == 'POST':
        nama = request.form.get('nama').upper().strip()
        tipe = request.form.get('tipe') or 'Pengeluaran'
        icon = request.form.get('icon') or 'fas fa-hashtag'
        cek = Kategori.query.filter_by(nama=nama, user_id=session['user_id']).first()
        if not cek:
            db.session.add(Kategori(nama=nama, tipe=tipe, icon=icon, user_id=session['user_id']))
            db.session.commit()
        return redirect(url_for('add_expense'))
    return render_template('main/add_category.html')

@app.route('/manage_categories')
@login_required
def manage_categories():
    list_kategori = Kategori.query.filter_by(user_id=session['user_id']).all()
    return render_template('main/manage_categories.html', categories=list_kategori)

@app.route('/delete_category/<int:id>')
@login_required
def delete_category(id):
    pakai_transaksi = Transaksi.query.filter_by(kategori_id=id).first()
    if pakai_transaksi:
        flash("Kategori dipakai transaksi!", "danger")
    else:
        kat = Kategori.query.get_or_404(id)
        db.session.delete(kat)
        db.session.commit()
    return redirect(url_for('manage_categories'))

@app.route('/chart')
@login_required
def chart():
    user = User.query.get(session['user_id'])
    month_param = request.args.get('month')
    if not month_param:
        current_date = datetime.now()
    else:
        try: current_date = datetime.strptime(month_param, '%Y-%m')
        except: current_date = datetime.now()
            
    selected_month_str = current_date.strftime('%Y-%m')
    nama_bulan = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    display_month = f"{nama_bulan[current_date.month]} {current_date.year}"

    transaksi = Transaksi.query.filter(
        Transaksi.user_id == user.id, Transaksi.tipe == 'Pengeluaran', 
        func.strftime('%Y-%m', Transaksi.tanggal) == selected_month_str
    ).all()

    cat_totals = {}
    grand_total = 0
    for t in transaksi:
        nama = t.kategori.nama
        nominal = t.nominal or 0
        cat_totals[nama] = cat_totals.get(nama, 0) + nominal
        grand_total += nominal

    data_list = []
    for k, v in cat_totals.items():
        persen = round((v / grand_total) * 100) if grand_total > 0 else 0
        data_list.append({'nama': k, 'total': v, 'persen': persen})

    sort_val = request.args.get('sort', 'tertinggi')
    data_list.sort(key=lambda x: x['total'], reverse=(sort_val != 'terendah'))

    return render_template('main/chart.html', user=user, data_list=data_list, 
                           display_month=display_month, current_month=selected_month_str, 
                           sort_val=sort_val, page='chart')

# --- 5. LOGIC UPLOAD FOTO DI PROFILE ---
@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    user = User.query.get(session['user_id'])
    
    if request.method == 'POST':
        # Update Nama & Pekerjaan
        user.nama = request.form.get('nama')
        user.pekerjaan = request.form.get('pekerjaan')
        
        # Update Password
        if request.form.get('password'):
            user.password = generate_password_hash(request.form.get('password'), method='pbkdf2:sha256')

        # --- UPDATE FOTO ---
        if 'foto' in request.files:
            file = request.files['foto']
            if file and file.filename != '':
                # Rename file biar unik (user_ID_filename)
                filename = secure_filename(f"user_{user.id}_{file.filename}")
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                user.foto = filename # Simpan nama file ke DB

        db.session.commit()
        return redirect(url_for('dashboard'))
        
    return render_template('main/profile.html', page='profile', user=user)

if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Akan membuat database V4 baru
    app.run(debug=True)