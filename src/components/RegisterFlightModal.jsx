import { useEffect, useState } from 'react';
import Modal from './Modal';
import { createFlight } from '../api/flights';
import { getApiErrorMessage } from '../utils/apiError';
import { normalizeFlightId } from '../utils/format';
import { useI18n } from '../hooks/useI18n';

export default function RegisterFlightModal({ open, onClose, onRegistered }) {
  const { t } = useI18n();
  const [flightId, setFlightId] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [flightType, setFlightType] = useState('departure');
  const [registerError, setRegisterError] = useState('');
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');

  useEffect(() => {
    if (!open) return;
    setRegisterError('');
    setRegisterSuccess('');
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setFlightDate((prev) => prev || `${y}-${m}-${d}`);
  }, [open]);

  const closeRegister = () => {
    if (registerSubmitting) return;
    setFlightId('');
    setRegisterError('');
    setRegisterSuccess('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    const id = normalizeFlightId(flightId);
    if (id.length < 2 || id.length > 10) {
      setRegisterError(t('register.errIdLen'));
      return;
    }
    if (!flightDate) {
      setRegisterError(t('register.errDate'));
      return;
    }

    setRegisterSubmitting(true);
    try {
      const created = await createFlight({
        flight_id: id,
        flight_date: flightDate,
        flight_type: flightType,
      });
      // 백엔드가 인천공항 OpenAPI에서 정보를 보강하지 못한 경우 enriched=false.
      // (구버전 백엔드 호환을 위해 airline/schedule_date_time도 함께 검사)
      const apiEnriched =
        created?.enriched !== false &&
        (created?.airline || created?.schedule_date_time);
      if (apiEnriched) {
        setRegisterSuccess(t('register.successOk'));
      } else {
        setRegisterSuccess(t('register.successPartial'));
      }
      setFlightId('');
      onRegistered?.();
      setTimeout(
        () => {
          closeRegister();
        },
        apiEnriched ? 700 : 2500,
      );
    } catch (err) {
      setRegisterError(getApiErrorMessage(err, t('register.errSubmit')));
    } finally {
      setRegisterSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeRegister}
      title={t('register.title')}
      ariaLabelledBy="register-flight-title"
      footer={
        <>
          <button
            type="button"
            onClick={closeRegister}
            disabled={registerSubmitting}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="register-flight-form"
            disabled={registerSubmitting}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {registerSubmitting ? t('register.submitting') : t('register.submit')}
          </button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        {t('register.hintBefore')}
        <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">{t('register.hintApi')}</code>
        {t('register.hintAfter')}
      </p>
      <form id="register-flight-form" onSubmit={handleSubmit} className="space-y-4">
        {registerError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            {registerError}
          </div>
        )}
        {registerSuccess && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
            {registerSuccess}
          </div>
        )}

        <div>
          <label
            htmlFor="reg-flight-id"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t('register.flightId')} <span className="text-red-500">*</span>
          </label>
          <input
            id="reg-flight-id"
            type="text"
            value={flightId}
            onChange={(e) => setFlightId(e.target.value)}
            placeholder={t('register.placeholderId')}
            autoComplete="off"
            maxLength={10}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 uppercase outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-slate-500">{t('register.idHelp')}</p>
        </div>

        <div>
          <label
            htmlFor="reg-flight-date"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t('register.flightDate')} <span className="text-red-500">*</span>
          </label>
          <input
            id="reg-flight-date"
            type="date"
            value={flightDate}
            onChange={(e) => setFlightDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t('register.typeLegend')}
          </legend>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="flight_type"
                value="departure"
                checked={flightType === 'departure'}
                onChange={() => setFlightType('departure')}
              />
              <span className="text-slate-800 dark:text-slate-200">{t('register.departureOpt')}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="flight_type"
                value="arrival"
                checked={flightType === 'arrival'}
                onChange={() => setFlightType('arrival')}
              />
              <span className="text-slate-800 dark:text-slate-200">{t('register.arrivalOpt')}</span>
            </label>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
