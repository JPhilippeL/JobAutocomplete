window.MY_PROFILE = {
    // 1. Datos personales básicos
    personal: {
        firstName:"",
        lastName:"",
        fullName:"",
        email:"",
        phone:"",
        address:"",
        city:"",
        stateProvince:"",
        postalCode:"",
        country:"",
        linkedin:"",
        github:"",
        website:""
    },

    // 2. Formación académica ordenada (de más reciente a más antigua)
    education: [
        {
            degree:"",
            institution:"",
            location:"",
            startDate:"",
            endDate:"",
            status:"",
            description:""
        },
        {
            degree:"",
            institution:"",
            location:"",
            startDate:"",
            endDate:"",
            status:"",
            description:""
        }
    ],

    // 3. Experiencia laboral
    experience: [
        {
            title:"",
            company:"",
            location:"",
            startDate:"",
            endDate:"",
            current: true,
            description:""
        },
        {
            title:"",
            company:"",
            location:"",
            startDate:"",
            endDate:"",
            current: false,
            description:""
        }
    ],

    // 4. Preguntas trampa / Filtros típicos de RRHH (ATS)
    screeningQuestions: {
        authorizedToWorkInEU:"",
        requiresSponsorship:"",
        englishLevel:"",
        spanishLevel:"",
        salaryExpectationEUR:"",
        noticePeriod:"",
        willingToRelocate:"",
        yearsOfExperienceGeneral:"",
        yearsOfExperienceAI:""
    },

    // 5. Carta de presentación / Resumen profesional
    summary:""
};