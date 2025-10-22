const {test , expect, request} = require ('@playwright/test')
const fs = require ('fs') ;
const path = require('path') ;


const USER_FILE = path.join(__dirname, 'test-user.json') ;

test('Register new user via API', async() => {
    const api = await request.newContext({
        baseURL:'https://ecommerce-playground.lambdatest.io/',
    });
    const email = `test+${Date.now()}@mail.com` ;
    const password = "Password 123!" ;
    const res  = await api.post('/index.php?route=account/register', {
       form: {
        firstname: 'Auto',
      lastname: 'Tester',
      email,
      telephone: '1234567890',
      password,
      confirm: password,
      agree: '1',
       } 
    }) ;
    expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body.toLowerCase()).toContain('your account has been created');

  fs.writeFileSync(USER_FILE, JSON.stringify({ email, password }, null, 2));
  console.log('✅ Registered user and saved credentials:', email);
}) ;