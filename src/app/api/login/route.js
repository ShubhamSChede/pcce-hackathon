// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import connectDB from './../../../lib/mongodb';
import User from './../../../models/User'; // Adjust the path as necessary

export async function POST(request) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Parse request body
    const { email, password } = await request.json();
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Return success response with user data
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    );
  }
}