const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Set mongoose to not be so strict about null vs undefined
mongoose.set('strictQuery', false);

const alumniSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters long']
  },
  profile: {
    type: String,
    default: ''
  },
  first_name: {
    type: String,
    required: false,
    default: '',
    validate: {
      validator: v => v === '' || /^[A-Za-z]+$/.test(v),
      message: 'First name must contain only letters.'
    }
  },
  middle_name: {
    type: String,
    required: false,
    default: '',
    validate: {
      validator: v => v === '' || /^[A-Za-z]+$/.test(v),
      message: 'Middle name must contain only letters.'
    }
  },
  last_name: {
    type: String,
    required: false,
    default: '',
    validate: {
      validator: v => v === '' || /^[A-Za-z]+$/.test(v),
      message: 'Last name must contain only letters.'
    }
  },
  dob: {
    type: Date,
    required: false,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', '', null],
    required: false,
    default: null
  },
  phone: {
    type: String,
    required: false,
    default: '',
    validate: {
      validator: v => v === '' || /^\d{10}$/.test(v),
      message: 'Phone must be 10 digits.'
    }
  },
  alt_phone: {
    type: String,
    required: false,
    default: '',
    validate: {
      validator: v => v === '' || /^\d{10}$/.test(v),
      message: 'Alternate phone must be 10 digits.'
    }
  },
  current_address: {
    type: String,
    required: false,
    default: ''
  },
  permanent_address: {
    type: String,
    required: false,
    default: ''
  },
  department: {
    type: String,
    required: false,
    default: ''
  },
  course: {
    type: String,
    required: false,
    default: ''
  },
  passing_year: {
    type: Number,
    required: false,
    default: null,
    set: function(value) {
      // Handle string values like "2025-05"
      if (typeof value === 'string') {
        if (value.includes('-')) {
          return parseInt(value.split('-')[0]);
        }
        return parseInt(value) || null;
      }
      return value;
    }
  },
  current_company: {
    type: String,
    required: false,
    default: ''
  },
  designation: {
    type: String,
    required: false,
    default: ''
  },
  current_location: {
    type: String,
    required: false,
    default: ''
  },
  joined_date: {
    type: Date,
    required: false,
    default: null
  },
  experience: {
    type: [{
      company: String,
      position: String,
      years: Number,
      months: Number,
      description: String
    }],
    default: []
  },
  skillset: {
    type: [String],
    default: []
  },
  projects: {
    type: [{
      title: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      technologies: {
        type: String,
        required: true
      },
      duration: {
        type: Number,
        required: true,
        min: 1,
        max: 12
      },
      link: {
        type: String
      }
    }],
    default: []
  },
  achievements: {
    type: [{
      type: {
        type: String,
        enum: ['sports', 'awards', 'academic', 'events'],
        required: false
      },
      title: {
        type: String,
        required: false
      },
      description: {
        type: String,
        required: false
      },
      date: {
        type: Date,
        required: false
      },
      organization: {
        type: String,
        required: false
      }
    }],
    default: []
  },
  education: {
    type: [{
      type: {
        type: String,
        enum: ['10th', '12th', 'Graduation', 'Post Graduation'],
        required: true
      },
      institution: {
        type: String,
        required: true
      },
      board: {
        type: String,
        required: true
      },
      year: {
        type: Number,
        required: true,
        validate: {
          validator: function(v) {
            const birthYear = this.parent().dob ? new Date(this.parent().dob).getFullYear() : 0;
            return v >= birthYear + 16;
          },
          message: 'Year must be at least 16 years after birth year'
        }
      },
      percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      }
    }],
    default: []
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  assigned_students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    start_date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Active', 'Completed'],
      default: 'Active'
    }
  }],
  current_students: {
    type: Number,
    default: 0
  },
  max_students: {
    type: Number,
    default: 3
  },
  mentorship_status: {
    type: String,
    enum: ['Available', 'Full'],
    default: 'Available'
  },
  mentorship_preferences: {
    departments: [String],
    courses: [String],
    years: [String]
  },
  can_mentor: {
    type: Boolean,
    default: false
  },
  mentees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  isApproved: {
    type: Boolean,
    default: false
  },
  resetPasswordOTP: {
    type: String,
    default: null
  },
  resetPasswordOTPExpires: {
    type: Date,
    default: null
  },
}, { 
  timestamps: true,
  strict: false // Allow fields not in schema
});

// Hash password before saving
alumniSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
alumniSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to validate profile completion
alumniSchema.methods.validateProfileCompletion = function() {
  // Basic required fields that must exist
  const requiredFields = [
    'first_name',
    'last_name',
    'department',
    'course'
  ];

  // Check if basic fields are filled
  const basicFieldsComplete = requiredFields.every(field => {
    const value = this[field];
    return value !== undefined && value !== null && value !== '';
  });

  return basicFieldsComplete;
};

module.exports = mongoose.model('Alumni', alumniSchema); 