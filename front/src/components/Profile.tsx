import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getInterestLabel } from '../constants/interests';
import './Profile.css';

const getLanguageLabel = (language?: string): string => {
  switch ((language || '').toLowerCase()) {
    case 'ru':
      return 'Русский';
    case 'en':
      return 'Английский';
    case 'ge':
      return 'Грузинский';
    default:
      return language || '';
  }
};

export const Profile = () => {
  const { user: profile, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner"></div>
        <p>Загрузка профиля...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <p>Профиль не найден</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-hero">
        <div className="profile-avatar">
          {(profile.name || 'П')
            .trim()
            .charAt(0)
            .toUpperCase()}
        </div>
        <h1 className="profile-name">{profile.name}</h1>
        <button
          type="button"
          className="profile-edit-link"
          onClick={() => navigate('/profile/edit')}
        >
          Редактировать
          <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="21" height="21" viewBox="0 0 21 21" fill="none">
            <rect width="20.062" height="20.062" fill="url(#pattern0_1671_2232)" />
            <defs>
              <pattern id="pattern0_1671_2232" patternContentUnits="objectBoundingBox" width="1" height="1">
                <use xlinkHref="#image0_1671_2232" transform="scale(0.00390625)" />
              </pattern>
              <image id="image0_1671_2232" width="256" height="256" preserveAspectRatio="none" xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAEB1JREFUeJzt3W+MHdddxvHnzN11Env9d6ugNjFI/UcLqMSyhVCTGv9Z7zpGaaGWt7YppEWAVRVF8dqGilf7AokC3rhUAilIKKqdxGGdtChp4ti7601DG9M2jipEhVoKEnajKI3X7DpxGnt35/DCuZbj7O6de+85M+fMfD+v586cN89zf2d25q4EAAAAAAAAAAAAAADKwhS9ACAkax98sXPl6xc3JYndYK1+RbK3Ssltku2S9H+SfmqkH8rY59Mr9vjol7ZMFb3mdlAAgKS7/3r89plaer+kz8moO+PH3jLS122S/O3I3o0/8Lk+XygAVNrdX33mppkrN/+FjD0g6ZYWT2NlzeGORR0Hjt+3/jWX6/ONAkBlbfqbsQ/UajomaY2bM9pXZJJdIwObvuXmfP5RAKiknqGRNUbJcUm/4PjUV4yx954c6HnM8Xm9oABQOT1DI2uMTUaa2Os3KzXG/uHJgZ6veTq/MxQAKiWH8NdFUQIUACojx/DXBV8CFAAqoYDw1wVdAhQASq/A8NcFWwIUAEotgPDXBVkCFABKK6Dw1wVXAhQASinA8NcFVQIUAEpny6HxOzSbjgYY/rpgSoACQKlEEP66IEqAAkBpRBT+usJLgAJAKUQY/rpCS4ACQPQiDn9dYSVAASBqJQh/XSElQAEgWiUKf13uJUABIEolDH9driVAASA6JQ5/XW4lQAEgKlu/cuqXZ2ftaUkri16LZ6mV+fzovk2HfV4k8XlywLWl7zv/E1mdKHodOUiM7EO9D4ze6/MiTACIzo7h4drk2e6HZbSz6LXkwOt2gAJAlCgBNygARIsSaB8FgKhRAu2hABA9SqB1FABKYcfwcG3yXPcRSbuKXksOnJUABYDSoASaRwGgVCiB5lAAKB1KIDsKAKVECWRDAaBQvQdPrbVGf7xi9fkvHuvvn3V57rUPvti56tLUY7L6tMvzBiqV1WdH9m8+2syHKAAU5mr47YiklbJ6bMUvTnyWEmjL5cTYLScGev416wcoABTiHeGv81gC3W9MHrUy212eN1AvpzfZXx/7056JLAfzNiBy1zM0ssYae1I3vtJrtHPyXPfRDYPjHS6vd2bPuunlqy98RlJT43Gkbksumy9nPZgJALma85v/RkwC7UoTYz52YmDTDxsdyASA3GQKv3R1Ejjb/fCO4eGay+uf2bNueqJrxS4j+4TL8wYoSVO7L8uBTADIRc/QyBqjZFTSqiY+dmz69WT3c4MbZ1yupSJ/InzTpDO3njzQd2mhg5gA4F3vwVNrjZIxNRd+SdrRuTQ97HoSONbfP3uha/m9JZ8EFqe1zp5GB1EA8Crz2D+/XZPnuo+wHWiesVrf6BgKAN7Me7e/ebv460Ar0l9tdAQFAC/aGPvnw3agaeaXGh1BAcA5B2P/fNgONGdZowMoADjlcOyfD9uBzEzD5ygoADjjYeyfD9uBTOxkoyMoADiRwzf/jZgEGrDSfzc6hgJA21p8yMeFHZ1L00ddl8Cx/v7ZFasnfl+Rl4CReanRMRQA2pLj2D8ftgPzSEz6XMNjclgHSqqAsX8+bAfexb6y7PYLLzQ6igJASwoc++fDduA6RuYfs7xNSQGgaQGM/fPxuh2Q0eMuz+vRxVpn599nOZACQFM8PuTjireHhS4sWb47hhIwxvzl8fvWv5blWAoAmQW0529k1+TZbufbgTN71k2vuH1ip5EedXlex743sWTZV7IeTAEgk4DH/rkZ9S9amn7Nx3Zgomv55wKdBF7umEm2n9mzbjrrBygANBTB2D8nK+2eOtft/J5AkNsBq4k0tduO//nGnzbzMQoAC4po7J+TlXZXYDswqSTZOnag59+b/SA/CYZ5BfinvtZZDU+/kfyej58XmzrXfdhKu12etwmTMsmWkYGNL7byYQoAcypV+OvKVwJthV+iADCHUoa/rjwl0Hb4JQoANyh1+OviLwEn4ZcoAFynEuGvi7cEnIVfogDwtkqFvy6+EnAafokCgCoa/rp4SsB5+CUKoPIqHf668EvAS/glHgSqtJ6hkTXGJiOqcvglyai/syt9xMerxMtXT/xBmw8LTabW9voIv8QEUFnXwm/UXfRaghHeJDCZWts7tr/n+y7Xcz0KoIII/wLCKQHv4ZcogMoh/BkUXwK5hF+iACqF8DehuBLILfwSBVAZhL8F+ZdAruGXKIBKIPxtyK8Ecg+/RAGUHuF3wH8JbCsi/BIFUGqx/pJPiKzMIytXn783y09tN2PD4HhHbens+8f29fzY5XmzogBKim9+DzxNAkWiAEqI8HtUshKgAEqG8OegRCVAAZQI4c9RSUqAAigJwl+AEpQABVAChL9AkZcABRA5wh+AiEuAAogY4Q9IpCVAAUSK8AcowhKgACJE+AMWWQnwk2CRufZfegl/mIz6O7pm/67oZWRFAUSkZ2hkjZU9IZ7tD9mkSWoPFb2IrNgCRIKxPwrefr3XFwogAoQ/CtGFX6IAgkf4oxBl+CUKIGiEPwrRhl+SnP4jBLhD+KNw9We89sUZfokJIEiEPwqF/IafaxRAYAh/FEoRfokCCArhj0Jpwi9RAMEg/FEoVfglCiAIhD8KpQu/RAEUjvBHoZThlyiAQhH+KJQ2/BIFUBjCH4VSh1+iAApB+KNQ+vBLFEDuCH8UKhF+iQLIFeGPQmXCL1EAuSH8UahU+CUKIBeEPwqVC79EAXhH+KNQyfBLFIBXhD8KlQ2/RAF4Q/ijUOnwSxSAF4Q/CpUPv0QBOEf4o0D430YBOET4o0D4r0MBOEL4o0D4b0ABOED4o0D450ABtInwR4Hwz4MCaAPhjwLhXwAF0CLCHwXC3wAF0ALCHwXCnwEF0CTCHwXCnxEF0ATCHwXC3wQKICPCHwXC3yQKIAPCHwXC34Kk6AWEjvBHYTIx6iP8zWMCWADhj8JkYtR3YmDz94peSIwogHkQ/igQ/jZRAHMg/FEg/A5QADcg/FEg/I5QANch/FEg/A5RAG8j/FEg/I5RACL8kSD8HlS+AAh/FAi/J7WiF1CkLYfG7zCpRgl/0KYIvz+VnQC2HBq/Q7Mp4Q/bVGLUS/j9qWQBEP4oEP4cVK4ACH8UCH9OKlUAhD8KhD9HlSkAwh8Fwp+zShQA4Y8C4S9A6QuA8EeB8Bek1AVA+KNA+AtU2gIg/FEg/AUrZQEQ/igQ/gCUrgAIfxQIfyBKVQCEPwqEPyClKQDCHwXCH5hSFADhjwLhD1D0BUD4o0D4AxV1ARD+KBD+gEVbAIQ/CoQ/cFEWAOGPAuGPQHQFQPijQPgjEVUBEP4oEP6IRPPfgQl/FKZMavgBz4hEMQEQ/ihMmdT0nTyw6btFLwTZBV8AhD8KhD9SQRcA4Y8C4Y9YsAVA+KNA+CMXZAEQ/igQ/hIIrgAIfxQIf0kEVQCEPwqEv0SCKQDCHwXCXzJBFADhjwLhL6HCC4DwR4Hwl1ShBUD4o0D4S6ywAuh7YPyDqU2/K2lVUWtAQ7zYU3KFvAy0YXD85tSm3xDhDxnhr4BCCqBjafp5Sb9WxLWRCW/1VUQhBWCM9hZxXWQylRj1suevhtwLoO+Bsd+Q1Yfyvi4y4Zu/YnIvgFlpZ97XRCbc7a+gXAtgcHAwMVb9eV4TmRD+isq1AL6zbP0nJN2W5zXREOGvsFwLwFj7mTyvh4YIf8Xl9iDQhsHxjs6l6cuSbs3rmlgQ4Ud+E0BHl90swh8Kwg9JORaAMZa7/2Eg/LgmlwLYMTi8SNKn8rgWFkT48Q65FMBU16ptklbmcS3Mi/DjXXIpACvD3f9iEX7MyftfAe558KnFb72x+FVJXb6vhTkRfszL+wRw+dItnxThLwrhx4K8F0BqGf8LQvjRkNctwN1ffWbZzPRNr0q62ed18C5TVsnW0X0b/63ohSBsXieA6Zmbtovw543wIzOvBcCz/7kj/GiKty3AhoPj7+k06SuSOnxdA+9A+NE0bxNAh0l3iPDnhfCjJd4KwEiM//kg/GiZly1A36Hn35um0+ck1XycH9cQfrTFywRgZ2d2ivD7RvjRNj8FwKu/vhF+OOF8C9BzaPT9JjU/8XFuSJIuWiV9hB8uOJ8AzKx2ivD7QvjhlPsCSHj23xPCD+ecflP3Hhz/iDXpf7o8JyQRfnjidAKwsrtcng+SCD88crsF4O6/a4QfXjkrgN6Dp9ZK+rCr84Hwwz9nBZAq5eafO4QfuXBTANYaY8wOJ+cC4UdunDyu27Nsw28a2f0uzlVxhB+5cjIBGFm+/dtH+JG79gvAWiPZ7Q7WUmWEH4VoewvQu2z9xyUNOFhLVRF+FMbFFoDxv3WEH4VqrwCsNVb6tKO1VA3hR+Ha2gL0LL3rLmPMXleLqRDCjyC0NQHwt/+WEH4Eo+UCGBwcTCTD3f/mXDJW9xB+hKLlAnih6xN3SbrN4VrK7pKx2nZy/+bni14IUNdyAVjD3f8mEH4EqaUCuDr+c/c/I8KPYLVUAN9ecud6Se9zvJYyIvwIWmtbAO7+Z0H4EbymC2BwcDAxRr/rYzElQvgRhab/eefppXf9lmTe62MxJXExTezWsb09p4teCNBI0xOAleHbf36EH1FprgCsNVbmdzytJWrW6kcmTe4k/IhJUwWweWhsnWRX+1pMpH4soy/MvJHccfLAxv8oejFAM5q6B5Bw8+8qqwmb2CeU2iOj+3q+I2Ns0UsCWtHkTcBK7/+nZPSkkY5deT05/tzgxhlJEr+EiIhlLoDNQ6MflvQRj2sJ0WUrjUjmWJJOP3HyQN+lohcEuJS5AGpKtltVYtJNJZ2WtcemVXvkuf0bzxe9IMCXzAVglX6y5P/1+/tWerSWdP7zib3rXyl6MUAeMiV6w8Hx93Sa9FV5+HfixTLnJPtorWYeevb+TT8qejVA3jJNAJ1K71Z5wj8loyetsYdH7980xh18VFmmArDG/LaJe/8/a6wZT42O3NJ16fGn9tzzpiSJXzNExTXcAuwYHq5Nnuv+maRVOazHtTOy9oixs0dPHuj7WdGLAULTcAKYOtt9p0xU4T8r6ahmZ/9p5M96/6voxQAha1gA1mhbHgtp03lr7bCt6WGexQeyy3IPYI33VbTm55K+aYyOTCxZ/uyZPeumi14QEJuGBWCkDwR0++8tGT1jUnv09WTx06cHPv7zohcExKzxFkC6ksdCFjBtZMZk0sfSK/ZfRr+0Zarg9QClkWECMP9rZT+ax2Kuc0XGjsiaxxMz/eSJga0Xcr4+UAlZ7gEcl7TV90L09os3iTVP1RZ1fOP4fetfy+GaQKU1ngDMlYet7fwrSYs9XH9SVs9KerJj0eWnj9+37aKHawCYR6Z3AXoPnvoTa+yDjq75P9bY0UTmm8svTpw4Nthf9D0GoLIyv97XOzT2D1b6QgvXuCJjXrDWPt1RM0/x0g0Qjqbe790yNPpFyXxZUtcCh81KeknSKRmdunnJm9++9uw9gKA0/YL/hkPjKzrS9I+MtFEyH5XstJVeNUYvyZpTdnr2W/ypDgAAAAAAAAAAAAAAAMjX/wP6uGD1MV72CAAAAABJRU5ErkJggg==" />
            </defs>
          </svg>
        </button>
      </div>

      <div className="profile-content">
        {profile.city && (
          <div className="profile-section">
            <h2 className="profile-section-title">Город</h2>
            <div className="profile-tags">
              <span className="profile-tag">{profile.city}</span>
            </div>
          </div>
        )}

        {profile.country && (
          <div className="profile-section">
            <h2 className="profile-section-title">Страна</h2>
            <div className="profile-tags">
              <span className="profile-tag">{profile.country}</span>
            </div>
          </div>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <div className="profile-section">
            <h2 className="profile-section-title">Интересы</h2>
            <div className="profile-tags">
              {profile.interests.map((interestCode, index) => (
                <span key={index} className="profile-tag">
                  {getInterestLabel(interestCode)}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.language && (
          <div className="profile-section">
            <h2 className="profile-section-title">Язык</h2>
            <div className="profile-tags">
              <span className="profile-tag">{getLanguageLabel(profile.language)}</span>
            </div>
          </div>
        )}

        {(!profile.interests || profile.interests.length === 0) && !profile.city && !profile.country && !profile.language && (
          <div className="profile-empty-state">
            Заполните профиль, чтобы персонализировать рекомендации
          </div>
        )}
      </div>
    </div>
  );
};

