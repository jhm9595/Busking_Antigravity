const secretKey = process.env.KAKAO_PAY_SECRET_KEY || process.env.KAKAO_PAY_ADMIN_KEY;
const cid = process.env.KAKAO_PAY_CID || 'TC0ONETIME';

async function testKakaoPayReady() {
    console.log('--- Testing Kakao Pay Ready API ---');
    console.log(`Using CID: ${cid}`);
    
    if (!secretKey) {
        console.error('Error: KAKAO_PAY_SECRET_KEY or KAKAO_PAY_ADMIN_KEY is missing in environment.');
        return;
    }

    const body = {
        cid: cid,
        partner_order_id: 'test_order_123',
        partner_user_id: 'test_user_123',
        item_name: 'Test Points (1000P)',
        quantity: 1,
        total_amount: 1100,
        tax_free_amount: 0,
        approval_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
        fail_url: 'http://localhost:3000/fail',
    };

    try {
        const response = await fetch('https://open-api.kakaopay.com/online/v1/payment/ready', {
            method: 'POST',
            headers: {
                Authorization: `SECRET_KEY ${secretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (response.ok) {
            console.log('SUCCESS!');
            console.log('TID:', data.tid);
            console.log('PC Redirect URL:', data.next_redirect_pc_url);
            console.log('Mobile Redirect URL:', data.next_redirect_mobile_url);
        } else {
            console.error('FAILED');
            console.error('Status:', response.status);
            console.error('Error Data:', data);
        }
    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

testKakaoPayReady();
